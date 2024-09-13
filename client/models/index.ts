import type { App } from "../app";
import { IBase, IReflect } from "../type";
import { BaseModelDef, CommonModelDef } from "../type/definition";
import { EventType } from "../type/event";
import { IModel } from "../type/model";
import { ModelKey } from "../type/registry";

/**
 * 反序列化阶段
 * 1. 节点被创建 Inited
 * 2. 节点挂载到父节点 Binded
 * 3. 节点挂载到根节点 Mounted
 * 
 * 初始化阶段
 * 4. 节点业务逻辑执行 Activated
 * 5. 节点业务状态流转，例如生物成熟、生殖死亡
 * 6. 节点业务逻辑销毁 Deactivated 
 * 
 * 销毁阶段
 * 7. 节点卸载自根节点 Unmounted
 * 8. 节点卸载自父节点 Unbinded
 * 9. 节点销毁完成 Destroyed
 */
export abstract class Model<
    M extends BaseModelDef = BaseModelDef
> {
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
    public readonly $childDict: IModel.ChildDict<M>;
    public readonly $childList: IModel.ChildList<M>;
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

    /** 事件触发器 */
    protected readonly reqDict!: IModel.ReqDict<M>;
    protected readonly resDict!: IModel.ResDict<M>;
    protected readonly handleReqDict!: IModel.HandleReqDict<M>;
    protected readonly callResDict!: IModel.CallResDict<M>;
    protected readonly bindResDict!: IModel.BindResDict<M>;
    protected readonly unbindResDict!: IModel.BindResDict<M>;

    private $callEffectRes<
        K extends IReflect.KeyOf<M[ModelKey.EffectDict]>
    >(
        key: K,
        event: M[ModelKey.EffectDict][K]
    ) {
        const effectResList = this.resDict.effect[key];
        effectResList.forEach(model => {
            model.handleReqDict.effect[key].call(model, event);
        });
    }

    private $callUpdateRes<        
        K extends IReflect.KeyOf<M[ModelKey.State]>
    >(
        key: K,
        event: EventType.StateUpdateDone<M, K>
    ) {
        const updateResList = this.resDict.update[key];
        updateResList.forEach(model => {
            model.handleReqDict.update[key].call(model, event);
        });
    }

    private $callReducerRes<
        K extends IReflect.KeyOf<M[ModelKey.State]>
    >(
        key: K,
        event: EventType.StateUpdateBefore<M, K>
    ) {
        const reducerResList = this.resDict.reduce[key];
        reducerResList.forEach(model => {
            model.handleReqDict.reduce[key].call(model, event);
        });
    }
    
    private $bindEffectRes<
        K extends IReflect.KeyOf<M[ModelKey.EffectDict]>
    >(
        key: K,
        handler: IModel.EffectRes<Record<K, M>>
    ) {
        handler.reqDict.effect[key].push(this);
        this.resDict.effect[key].push(handler);
    }

    private $unbindEffectRes<
        K extends IReflect.KeyOf<M[ModelKey.EffectDict]>
    >(
        key: K,
        handler: IModel.EffectRes<Record<K, M>>                                       
    ) { 
        const handlerIndex = handler.reqDict.effect[key].indexOf(this);
        const emitterIndex = this.resDict.effect[key].indexOf(handler);
        if (handlerIndex < 0 || emitterIndex < 0) {
            throw new Error();
        }
        handler.reqDict.effect[key].splice(handlerIndex, 1);
        this.resDict.effect[key].splice(emitterIndex, 1);
    }

    private $bindUpdateRes<
        K extends IReflect.KeyOf<M[ModelKey.State]>
    >(
        key: K,
        handler: IModel.UpdateRes<Record<K, M>>
    ) {
        handler.reqDict.update[key].push(this);
        this.resDict.update[key].push(handler);
    }

    private $unbindUpdateRes<
        K extends IReflect.KeyOf<M[ModelKey.State]>
    >(
        key: K,
        handler: IModel.UpdateRes<Record<K, M>>
    ) {
        const handlerIndex = handler.reqDict.update[key].indexOf(this);
        const emitterIndex = this.resDict.update[key].indexOf(handler);
        if (handlerIndex < 0 || emitterIndex < 0) {
            throw new Error();
        }
        handler.reqDict.update[key].splice(handlerIndex, 1);
        this.resDict.update[key].splice(emitterIndex, 1);
    }

    private $bindReduceRes<
        K extends IReflect.KeyOf<M[ModelKey.State]>
    >(
        key: K,
        handler: IModel.ReduceRes<Record<K, M>>
    ) {
        handler.reqDict.reduce[key].push(this);
        this.resDict.reduce[key].push(handler);
    }

    private $unbindReducerRes<
        K extends IReflect.KeyOf<M[ModelKey.State]>
    >(
        key: K,
        handler: IModel.ReduceRes<Record<K, M>>
    ) {
        const handlerIndex = handler.reqDict.reduce[key].indexOf(this);
        const emitterIndex = this.resDict.reduce[key].indexOf(handler);
        if (handlerIndex < 0 || emitterIndex < 0) {
            throw new Error();
        }
        handler.reqDict.reduce[key].splice(handlerIndex, 1);
        this.resDict.reduce[key].splice(emitterIndex, 1);
    }

    /** 测试用例 */
    public debuggerDict: Record<string, IBase.Func>;
    public readonly stateSetterList: IBase.Func[] = [];
    public readonly childrenSetterList: IBase.Func[] = [];
    public readonly producerSetterList: IBase.Func[] = [];
    public readonly consumerSetterList: IBase.Func[] = [];

    private $setChildren() {
        this.childrenSetterList.forEach(setter => {
            setter(this.children);
        });
    }
    private $setState() {
        this.stateSetterList.forEach(setter => {
            setter(this.currentState);
        });
    }

    constructor(
        config: IModel.Config<M>,
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

        /** 事件 */
        // Object.keys(config.producerChunkDict || {}).forEach(<
        //     K extends IReflect.KeyOf<ModelType.ProducerDict<M>>
        // >(key: K) => {
        //     if (config.producerChunkDict) {
        //         const producerList = config.producerChunkDict[key] || [];
        //         producerList.forEach((id: string) => {
        //             const model = app.referService.referDict[id];
        //             if (model) {
        //                 model.$bindConsumer(key, this);
        //             }
        //         });
        //     }
        // });
        // Object.keys(config.consumerChunkDict || {}).forEach(<
        //     K extends IReflect.KeyOf<ModelType.ConsumerDict<M>>
        // >(key: K) => {
        //     if (config.consumerChunkDict) {
        //         const consumerList = config.consumerChunkDict[key] || [];
        //         consumerList.forEach((id: string) => {
        //             const model: any = app.referService.referDict[id];
        //             if (model) {
        //                 this.$bindConsumer(key, model);
        //             }
        //         });
        //     }
        // });


        // this.$emitterDict = new Proxy(
        //     {} as any,
        //     {
        //         get: <K extends IReflect.KeyOf<ModelType.EmitterDict<M>>>(
        //             target: any, 
        //             key: K
        //         ) => {
        //             return this.$emitProvider.bind(this, key);
        //         },
        //         set: () => false
        //     }
        // );
        // this.event = new Proxy(
        //     {} as any,
        //     {
        //         get: <K extends IReflect.KeyOf<ModelType.ConsumerDict<M>>>(
        //             target: any, 
        //             key: K
        //         ) => {
        //             return {
        //                 bind: this.$bindConsumer.bind(this, key),
        //                 unbind: this.$unbindConsumer.bind(this, key)
        //             };
        //         },
        //         set: () => false
        //     }
        // );

        /** 初始化状态 */
        this.$originState = new Proxy(config.originState, {
            set: (origin, key: IReflect.KeyOf<M[ModelKey.State]>, value) => {
                origin[key] = value;
                this.updateState(key);
                return true;
            }
        });
        this.$currentState = { 
            ...this.$originState
        };

        /** 树形结构 */
        this.$childList = config.childChunkList.map(chunk => {
            return app.factoryService.unserialize(chunk, this);
        });
        const origin = {} as IModel.ChildDict<M>;
        for (const key in config.childChunkDict) {
            const chunk = config.childChunkDict[key];
            origin[key] = app.factoryService.unserialize(chunk, this);
        }
        this.$childDict = new Proxy(origin, {
            set: (origin, key: IReflect.KeyOf<M[ModelKey.ChildDefDict]>, value) => {
                origin[key] = value;
                this.$setChildren();
                return true;
            }
        });
        this.debuggerDict = {};
    }

    /** 初始化 */
    public $initialize() {
        this.$inited = true;
        this.$childList.forEach(child => {
            child.$initialize();
        });
        for (const key in this.$childDict) {
            const child = this.childDict[key];
            child.$initialize();
        }
    }

    /** 添加子节点 */
    protected $appendChild(target: IReflect.IteratorOf<IModel.ChildList<M>>) {
        this.$childList.push(target);
        this.$setChildren();
    }

    /** 移除子节点 */
    protected $removeChild(target: Model) {
        const index = this.$childList.indexOf(target as any);
        if (index >= 0) {
            this.$childList.splice(index, 1); 
            this.$setChildren();
            return;
        }
        for (const key in this.$childDict) {
            if (this.$childDict[key] === target) {
                delete this.$childDict[key];
                this.$setChildren();
                return;
            }
        }
        throw new Error();
    }

    protected $destroy() {
        this.app.referService.removeRefer(this);
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
    public updateState<K extends IReflect.KeyOf<M[ModelKey.State]>>(key: K) {
        const prev = this.$currentState[key];
        const current = this.$originState[key];
        const event = {
            target: this,
            prev: current,
            next: current
        };
        this.$callReducerRes(key, event);
        const next = event.next;
        if (prev !== next) {
            this.$currentState[key] = next;
            this.$callUpdateRes(key, event);
            this.$setState();
        }
    }

    /** 序列化函数 */
    public serialize(): IModel.Chunk<M> {
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
            childChunkList
        } as any;
    }
}