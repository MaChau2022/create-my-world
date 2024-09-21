import type { App } from "../app";
import { IBase, IReflect } from "../type";
import { IModel } from "../type/model";
import { ModelStatus } from "../type/status";
import { childDictProxy, childListProxy } from "../utils/child";
import { emitterDictProxy } from "../utils/emitter";
import { Entity } from "../utils/entity";
import { handlerDictProxy } from "../utils/handler";

/** 模型基类 */
export abstract class Model<
    M extends IModel.Define = IModel.Define
> extends Entity {
    /** 状态机 */
    private $status: ModelStatus;
    public get status() { return this.$status; }

    /** 基本信息 */
    public readonly id: string;
    public readonly code: IModel.Code<M>;
    public readonly rule: Partial<IModel.Rule<M>>;

    private $inited?: boolean;

    /** 数据结构 */
    protected readonly $originState: IModel.State<M>;
    private readonly $currentState: IModel.State<M>;
    public get currentState() { return { ...this.$currentState }; }
    
    /** 从属关系 */
    private $parent?: IModel.Parent<M>;
    public get parent() {
        const parent = this.$parent;
        if (!parent) throw new Error();
        return parent;
    }
    public get root() {
        const root = this.app.root;
        if (!root) throw new Error();
        return root;
    }

    private readonly $hooks: {
        childList: IModel.ModelHookDict;
        childDict: IModel.ModelHookDict;
        handlerDict: IModel.EventHookDict;
        emitterDict: IModel.EventHookDict;
        updaterDict: IModel.EventHookDict;
        watcherDict: IModel.EventHookDict;
    };

    public readonly $childDict: IModel.ChildDict<M>;
    public readonly $childList: IModel.ChildList<M>;

    public get childList() { return [ ...this.$childList ]; }
    public get childDict() { return { ...this.$childDict }; }
    public get children(): Model[] {
        return [
            ...this.childList,
            ...Object.values(this.childDict)
        ];
    }

    /** 事件触发器/处理器 */
    public readonly emitterDict: IModel.EmitterDict<IModel.EmitterDefDict<M>>;
    public readonly updaterDict: IModel.EmitterDict<IModel.StateUpdateBefore<M>>;
    public readonly watcherDict: IModel.EmitterDict<IModel.StateUpdateDone<M>>;
    public readonly $handlerDict: IModel.HandlerDict<IModel.HandlerDefDict<M>>;

    public abstract readonly $handlerCallerDict: IModel.EventHandlerCallerDict<M>;

    /** 测试用例 */
    public debuggerDict: Record<string, IBase.Func>;
    public readonly stateSetterList: IBase.Func[] = [];
    public readonly childrenSetterList: IBase.Func[] = [];

    public $setChildren() {
        this.childrenSetterList.forEach(setter => {
            setter(this.children);
        });
    }
    private $setState() {
        const result = this.currentState;
        console.log('set_state', result);
        this.stateSetterList.forEach(setter => {
            setter(result);
        });
    }

    constructor(
        config: IModel.BaseConfig<M>,
        app: App
    ) {
        super(app);
        this.$status = ModelStatus.CREATED;
        this.$inited = config.inited;

        console.log('constructor', this.constructor.name);
        
        /** 基本信息 */
        this.id = config.id || app.referenceService.getUniqId();
        this.code = config.code;
        this.rule = config.rule || {};
        
        /** 数据结构 */
        this.$originState = new Proxy(config.originState, {
            set: (origin, key: IReflect.Key<IModel.State<M>>, value) => {
                origin[key] = value;
                this.updateState(key);
                return true;
            }
        });
        this.$currentState = { ...this.$originState };

        /** 
         * 初始化从属关系
         * 初始化依赖关系
         */
        const childList = childListProxy(config.childBundleList, this, this.app);
        this.$childList = childList.proxy;

        const childDict = childDictProxy(config.childBundleDict, this, this.app);
        this.$childDict = childDict.proxy;

        const handlerDict = handlerDictProxy(config.eventHandlerBundleDict, this);
        this.$handlerDict = handlerDict.proxy;

        const emitterDict = emitterDictProxy(config.eventEmitterBundleDict, this);
        this.emitterDict = emitterDict.proxy;

        const updaterDict = emitterDictProxy<
            IModel.StateUpdateBefore<M>
        >(config.stateUpdaterBundleDict, this);
        this.updaterDict = updaterDict.proxy;

        const watcherDict = emitterDictProxy<
            IModel.StateUpdateDone<M>
        >(config.stateEmitterBundleDict, this);
        this.watcherDict = watcherDict.proxy;

        this.$hooks = {
            childDict: childDict.hooks,
            childList: childList.hooks,
            handlerDict: handlerDict.hooks,
            emitterDict: emitterDict.hooks,
            updaterDict: updaterDict.hooks,
            watcherDict: watcherDict.hooks
        };

        /** 调试器 */
        this.debuggerDict = {};
    }

    /** 挂载父节点 */
    public $bindParent(parent: IModel.Parent<M>) {
        this.$parent = parent;
        console.log('bind_parent', this.constructor.name);
        this.$status = ModelStatus.BINDED;
        /** 如果父节点从属于根节点，则触发根节点挂载 */
        if (
            /** 如果父节点等于自身，则自身为根节点 */
            this.$parent === this ||
            this.$parent.status === ModelStatus.MOUNTED 
        ) {
            this.$mountRoot();
        }
    }

    /** 挂载根节点 */
    public $mountRoot() {
        this.$status = ModelStatus.MOUNTING;
        console.log('mount_root', this.constructor.name);
        this.app.referenceService.addRefer(this);
        this.$hooks.childList.$mountRoot();
        this.$hooks.childDict.$mountRoot();
        this.$hooks.handlerDict.$mountRoot();
        this.$hooks.emitterDict.$mountRoot();
        this.$hooks.updaterDict.$mountRoot();
        this.$status = ModelStatus.MOUNTED;
    }

    public $unmountRoot() {
        this.$status = ModelStatus.UNMOUNTING;
        console.log('unmount_root', this.constructor.name);
        this.$hooks.childList.$unmountRoot();
        this.$hooks.childDict.$unmountRoot();
        this.$hooks.handlerDict.$unmountRoot();
        this.$hooks.emitterDict.$unmountRoot();
        this.$hooks.updaterDict.$unmountRoot();
        this.app.referenceService.removeRefer(this);
        this.$status = ModelStatus.UNMOUNTED;
    }

    public $unbindParent() {
        if (this.status === ModelStatus.MOUNTED) {
            this.$unmountRoot();
        }
        console.log('unbind_parent', this.constructor.name);
        this.$parent = undefined;
        this.$status = ModelStatus.UNBINDED;
    }

    /** 初始化 */
    public bootDriver() {}
    public $bootDriver() {
        if (!this.$inited) {
            console.log('boot_model', this.constructor.name);
            this.bootDriver();
            this.$inited = true;
        }
        /** 遍历 */
        this.$hooks.childList.$bootDriver();
        this.$hooks.childDict.$bootDriver();
    }

    public unbootDriver() {}
    public $unbootDriver() {
        if (this.$inited) {
            console.log('unboot_model', this.constructor.name);
            this.unbootDriver();
            this.$inited = false;
        }
        /** 遍历 */
        this.$hooks.childList.$unbootDriver();
        this.$hooks.childDict.$unbootDriver();
    }

    /** 更新状态 */
    public updateState<K extends IReflect.Key<IModel.State<M>>>(key: K) {   
        const prev = this.$currentState[key];
        const current = this.$originState[key];
        const event = {
            target: this,
            prev: current,
            next: current
        };
        this.updaterDict[key].emitEvent(event);
        const next = event.next;
        if (prev !== next) {
            this.$currentState[key] = next;
            if (this.$status === ModelStatus.MOUNTED) {
                this.watcherDict[key].emitEvent(event);
                this.$setState();
            }
        }
    }

    /** 序列化函数 */
    public makeBundle(): IModel.Bundle<M> {
        return {
            id: this.id,
            code: this.code,
            rule: this.rule,
            originState: this.$originState,
            childBundleDict: this.$hooks.childDict.$makeBundle(),
            childBundleList: this.$hooks.childList.$makeBundle(),
            eventEmitterBundleDict: this.$hooks.emitterDict.$makeBundle(),
            eventHandlerBundleDict: this.$hooks.handlerDict.$makeBundle(),
            stateUpdaterBundleDict: this.$hooks.updaterDict.$makeBundle(),
            stateEmitterBundleDict: this.$hooks.watcherDict.$makeBundle(),
            inited: true
        };
    }
}