import type { App } from "../app";
import { IBase, IReflect } from "../type";
import { UpdaterProxy } from "../utils/updater-proxy";
import { HandlerProxy } from "../utils/handler-proxy";
import { EmitterProxy } from "../utils/emitter-proxy";
import { BaseModelDef } from "../type/definition";
import { ModelType } from "../type/model";
import { ConnectorType } from "../type/connector";
import { ModelKey } from "../type/registry";
import { ModelStatus } from "../type/status";

export abstract class Model<
    M extends BaseModelDef = BaseModelDef
> {
    private status: ModelStatus;

    /** 外部指针 */
    public readonly app: App;
    public readonly parent: M[ModelKey.Parent];
    public get root() {
        const result = this.app.root;
        if (!result) {
            throw new Error();
        }
        return result;
    }

    /** 基本信息 */
    public readonly id: string;
    public readonly code: M[ModelKey.Code];

    /** 预设参数 */
    protected $inited: boolean;
    private readonly $preset: Partial<M[ModelKey.Preset]>;

    /** 状态 */
    protected readonly $originState: M[ModelKey.State];
    private readonly $currentState: M[ModelKey.State]; 
    public get currentState() { 
        return { ...this.$currentState }; 
    }
    
    /** 子节点 */
    public readonly $childDict: ModelType.ChildDict<M>;
    public readonly $childList: ModelType.ChildList<M>;
    public get childList() {
        return [ ...this.$childList ];
    }
    public get childDict() {
        return { ...this.$childDict };
    }
    public get children(): Model[] {
        return [
            ...this.childList,
            ...Object.values(this.childDict)
        ];
    }
    
    /** 状态修饰器代理 */
    private readonly $updaterProxy: UpdaterProxy<M>;
    protected readonly $updaterDict: ModelType.UpdaterDict<M>;
    public readonly updaterDict: ModelType.SafeUpdaterDict<M>;

    /** 事件接收器代理 */
    private readonly $handlerProxy: HandlerProxy<M[ModelKey.HandlerEventDict], Model<M>>;
    protected readonly $handlerDict: ConnectorType.HandlerDict<M[ModelKey.HandlerEventDict], Model<M>>;
   
    /** 事件触发器代理 */
    private readonly $emitterProxy: EmitterProxy<M[ModelKey.EmitterEventDict], Model<M>>;
    protected readonly $emitterDict: ConnectorType.EmitterDict<M[ModelKey.EmitterEventDict], Model<M>>;
    public readonly emitterDict: ConnectorType.SafeEmitterDict<M[ModelKey.EmitterEventDict], Model<M>>;

    /** 测试用例 */
    public testcaseDict: Record<string, IBase.Func>;

    constructor(
        loader: ConnectorType.CallerDict<M[ModelKey.HandlerEventDict]>, 
        config: ModelType.Config<M>,
        parent: M[ModelKey.Parent],
        app: App
    ) {
        this.app = app;
        this.parent = parent;

        /** 基本信息 */
        this.id = config.id || app.referService.getUniqId();
        this.code = config.code;
        this.$inited = config.inited || false;
        this.$preset = config.preset || {};
 
        /** 初始化状态更新器 */
        this.$updaterProxy = new UpdaterProxy<M>(
            config.updaterChunkDict, 
            this,
            app
        );
        this.$updaterDict = this.$updaterProxy.updaterDict;
        this.updaterDict = this.$updaterProxy.safeUpdaterDict;
        
        /** 初始化事件触发器 */
        this.$emitterProxy = new EmitterProxy(
            config.emitterChunkDict, 
            this,
            app
        );
        this.$emitterDict = this.$emitterProxy.emitterDict;
        this.emitterDict = this.$emitterProxy.safeEmitterDict;

        this.$handlerProxy = new HandlerProxy(
            loader,
            config.handlerChunkDict,
            this,
            app
        );
        this.$handlerDict = this.$handlerProxy.handlerDict;

        /** 初始化状态 */
        this.$originState = new Proxy(config.originState, {
            set: (origin, key: keyof M[ModelKey.State], value) => {
                origin[key] = value;
                this.updateState(key);
                return true;
            }
        });
        this.$currentState = { 
            ...this.$originState
        };

        /** 初始化节点 */
        this.$childList = config.childChunkList.map(chunk => {
            return app.factoryService.unserialize(chunk, this);
        });
        const origin = {} as ModelType.ChildDict<M>;
        for (const key in config.childChunkDict) {
            const chunk = config.childChunkDict[key];
            origin[key] = app.factoryService.unserialize(chunk, this);
        }
        this.$childDict = new Proxy(origin, {
            set: (origin, key: keyof M[ModelKey.ChildDefDict], value) => {
                origin[key] = value;
                this.$emitterDict.childUpdateDone.emitEvent({
                    target: this,
                    children: this.children
                });
                return true;
            }
        });
        this.testcaseDict = {};

        this.status = ModelStatus.UNMOUNTED;
    }

    /** 初始化 */
    public $initialize() {
        this.$inited = true;
        this.$childList.forEach((child: Model) => {
            child.$initialize();
        });
        for (const key in this.$childDict) {
            const child: Model = this.childDict[key];
            child.$initialize();
        }
    }

    /** 添加子节点 */
    protected $appendChild(target: IReflect.Iterator<ModelType.ChildList<M>>) {
        this.$childList.push(target);
        this.$emitterDict.childUpdateDone.emitEvent({
            target: this,
            children: this.children
        });
    }

    /** 移除子节点 */
    protected $removeChild(target: Model) {
        const index = this.$childList.indexOf(target as any);
        if (index >= 0) {
            this.$childList.splice(index, 1); 
            this.$emitterDict.childUpdateDone.emitEvent({
                target: this,
                children: this.children
            });
            return;
        }
        for (const key in this.$childDict) {
            if (this.$childDict[key] === target) {
                delete this.$childDict[key];
                this.$emitterDict.childUpdateDone.emitEvent({
                    target: this,
                    children: this.children  
                });
                return;
            }
        }
        throw new Error();
    }

    protected $destroy() {
        this.$emitterProxy.destroy();
        this.$handlerProxy.destroy();
        this.$updaterProxy.destroy();
        this.$childList.forEach((child: Model) => {
            child.$destroy();
        });
        for (const key in this.$childDict) {
            const child: Model = this.childDict[key];
            child.$destroy();
        }
        if (this.parent) {
            this.parent.$removeChild(this);
        }
    }

    /** 更新状态 */
    public updateState<
        K extends keyof M[ModelKey.State]
    >(key: K) {
        const prev = this.$currentState[key];
        const current = this.$originState[key];
        const event = {
            target: this,
            prev: current,
            next: current
        };
        this.$updaterProxy.updaterDict[key].emitEvent(event);
        const next = event.next;
        if (prev !== next) {
            this.$currentState[key] = next;
            this.$emitterDict.stateUpdateDone.emitEvent({
                target: this,
                state: this.currentState
            });
        }
    }

    /** 序列化函数 */
    public serialize(): ModelType.Chunk<M> {
        const childChunkDict = {} as any;
        for (const key in this.childDict) {
            const child = this.childDict[key];
            childChunkDict[key] = child.serialize();
        }
        const childChunkList = this.childList.map(child => {
            return child.serialize(); 
        });
        return {
            inited: true,
            id: this.id,
            code: this.code,
            preset: this.$preset,
            originState: this.$originState,
            childChunkDict,
            childChunkList,
            emitterChunkDict: this.$emitterProxy.serialize(),
            handlerChunkDict: this.$handlerProxy.serialize(),
            updaterChunkDict: this.$updaterProxy.serialize()
        };
    }
}