import type { App } from "../app";
import { IBase, IReflect } from "../type";
import { ModelCode } from "../type/registry";
import { ModelStatus } from "../type/status";
import { childDictProxy, childListProxy } from "../utils/child";
import { EmitterProxy } from "../utils/emitter";
import { Entity } from "../utils/entity";
import { HandlerDictProxy } from "../utils/handler";

export type IModel = {
    code: ModelCode
    rule: IBase.Data
    state: IBase.Data
    parent: Model;
    childList: Array<IModel>
    childDict: Record<IBase.Key, IModel>,
    emitterEventDict: IBase.Dict,
    handlerEventDict: IBase.Dict,
}

export namespace IModel {
    export type Code<M extends IModel> = M['code']
    export type Rule<M extends IModel> = M['rule']
    export type State<M extends IModel> = M['state']
    export type Parent<M extends IModel> = M['parent']
    export type ChildDict<M extends IModel> = M['childDict']
    export type ChildList<M extends IModel> = M['childList']
    export type EmitterEventDict<M extends IModel> = M['emitterEventDict']
    export type HandlerEventDict<M extends IModel> = M['handlerEventDict']
}

export type IModelConfig<
    M extends IModel
> = {
    id?: string
    inited?: boolean
    code: IModel.Code<M>
    rule?: Partial<IModel.Rule<M>>
    originState: IModel.State<M>
    childBundleList: ChildConfigList<M>,
    childBundleDict: ChildConfigDict<M>,
    eventEmitterBundleDict?: Partial<EmitterBundleDict<EmitterDefDict<M>>>,
    eventHandlerBundleDict?: Partial<HandlerBundleDict<HandlerDefDict<M>>>,
    stateUpdaterBundleDict?: Partial<EmitterBundleDict<State<M>>>,
    stateEmitterBundleDict?: Partial<EmitterBundleDict<State<M>>>,
}

enum EmitterType {
    StateUpdateBefore = 'state_update_before',
    StateUpdateDone = 'state_update_done',
}

interface Emitter<E> {
    id: string;
    key: string;
    type?: EmitterType;
    handlerList: Handler<E>[]
    callHandler: (event: E) => void,
    bindHandler: (handler: Handler<E>) => void,
    unbindHandler: (handler: Handler<E>) => void,
}

interface Handler<H> {
    id: string;
    key: string;
    emitterList: Emitter<H>[]
    handleEvent: (event: H) => void,
}

export abstract class Model<
    M extends IModel = IModel
> {
    public readonly id: string;
    public readonly rule: Partial<IModel.Rule<M>>;

    
    private $initHandlerDict(config?: {
        [K in IReflect.Key<IModel.HandlerEventDict<M>>]: Array<{
            id: string,
            key: string,
            type?: EmitterType
        }>
    }) {
        const origin = {} as {
            [K in IReflect.Key<IModel.HandlerEventDict<M>>]:
                Handler<IModel.HandlerEventDict<M>[K]>
        };
        if (config) {
            const keys = Object.keys(config);
            for (const key of keys) {
                const handler = this.$initHandler(key);
                for (const subConfig of config[key]) {
                    const { id, key } = subConfig;
                    const model = window.$app.reference.modelDict[id];
                    if (model) {
                        model.$emitterDict[key].bindHandler(handler);
                    }
                }
            }
        }
        return new Proxy(origin, {
            get: (
                target, 
                key: IReflect.Key<IModel.HandlerEventDict<M>>
            ) => {
                if (!target[key]) {
                    target[key] = this.$initHandler(key);
                }
                return target[key];
            },
            set: () => false
        });
    }


    private $bindHandler<
        K extends IReflect.Key<IModel.EmitterEventDict<M>>
    >(
        emitter: Emitter<IModel.EmitterEventDict<M>[K]>, 
        handler: Handler<IModel.EmitterEventDict<M>[K]>
    ) {
        emitter.handlerList.push(handler);
        handler.emitterList.push(emitter);
    }

    private $unbindHandler<
        K extends IReflect.Key<IModel.EmitterEventDict<M>>
    >(
        emitter: Emitter<IModel.EmitterEventDict<M>[K]>, 
        handler: Handler<IModel.EmitterEventDict<M>[K]>
    ) {
        const handlerIdx = emitter.handlerList.indexOf(handler);
        const emitterIdx = handler.emitterList.indexOf(emitter);
        if (handlerIdx >= 0) emitter.handlerList.splice(handlerIdx, 1);
        if (emitterIdx >= 0) handler.emitterList.splice(emitterIdx, 1);
    }

    private $callHandler<
        K extends IReflect.Key<IModel.EmitterEventDict<M>>
    >(
        emitter: Emitter<IModel.EmitterEventDict<M>[K]>,
        event: IModel.EmitterEventDict<M>[K]
    ) {
        emitter.handlerList.forEach(handler => {
            handler.handleEvent(event);
        });
    }

    protected abstract readonly handlerIntf: {
        [K in IReflect.Key<IModel.HandlerEventDict<M>>]: 
            (event: IModel.HandlerEventDict<M>[K]) => void
    }

    private readonly $emitterDict: {
        [K in IReflect.Key<IModel.EmitterEventDict<M>>]: 
            Emitter<IModel.EmitterEventDict<M>[K]>
    };
    private readonly $handlerDict: {
        [K in IReflect.Key<IModel.HandlerEventDict<M>>]: 
            Handler<IModel.HandlerEventDict<M>[K]>
    };

    constructor(config: IModelConfig<M>) {
        this.id = config.id || window.$app.reference.register();
        this.rule = config.rule || {};

        this.$handlerDict = this.$initHandlerDict(
            config.eventHandlerBundleDict
        );
        this.$emitterDict = this.$createEmitterDict(
            config.eventEmitterBundleDict
        );
    }


    

    // 创建事件处理器
    private $initHandler<
        K extends IReflect.Key<IModel.HandlerEventDict<M>>
    >(key: K): Handler<IModel.HandlerEventDict<M>[K]> {
        const handler = {} as Handler<IModel.HandlerEventDict<M>[K]>;
        Object.assign(handler,  {
            id: this.id,
            key,
            emitterList: [],
            handleEvent: (event: IModel.HandlerEventDict<M>[K]) => {
                this.handlerIntf[key].call(this, event);
            }
        });
        return handler;
    }

    
    // 创建事件触发器
    private $createEmitter<
        K extends IReflect.Key<IModel.EmitterEventDict<M>>
    >(key: K): Emitter<IModel.EmitterEventDict<M>[K]> {
        const emitter = {} as Emitter<IModel.EmitterEventDict<M>[K]>;
        Object.assign(emitter,  {
            id: this.id,
            key,
            handlerList: [],
            callHandler: this.$callHandler.bind(this, emitter),
            bindHandler: this.$bindHandler.bind(this, emitter),
            unbindHandler: this.$unbindHandler.bind(this, emitter)
        });
        return emitter;
    }
    
    // 创建事件触发器字典
    private $createEmitterDict(config?: {
        [K in IReflect.Key<IModel.EmitterEventDict<M>>]: Array<{
            id: string,
            key: string,
        }>
    }) {
        const origin = {} as {
            [K in IReflect.Key<IModel.EmitterEventDict<M>>]:
                Emitter<IModel.EmitterEventDict<M>[K]>
        };
        if (config) {
            const keys = Object.keys(config);
            for (const key of keys) {
                const emitter = this.$createEmitter(key);
                for (const subConfig of config[key]) {
                    const { id, key } = subConfig;
                    const model = window.$app.reference.modelDict[id];
                    if (model) {
                        emitter.bindHandler(model.$handlerDict[key]);
                    }
                }
            }
        }
        return new Proxy(origin, {
            get: (target, key: IReflect.Key<IModel.EmitterEventDict<M>>) => {
                if (!target[key]) {
                    target[key] = this.$createEmitter(key);
                }
                return target[key];
            },
            set: () => false
        });
    }

}

/** 模型基类 */
// export abstract class Model<
//     M extends IModel.Define = IModel.Define
// > extends Entity {
//     /** 状态机 */
//     private $status: ModelStatus;
//     public get status() { return this.$status; }

//     /** 基本信息 */
//     public readonly id: string;
//     public readonly code: IModel.Code<M>;
//     public readonly rule: Partial<IModel.Rule<M>>;

//     private $inited?: boolean;

//     /** 数据结构 */
//     protected readonly $originState: IModel.State<M>;
//     private readonly $currentState: IModel.State<M>;
//     public get currentState() { return { ...this.$currentState }; }
    
//     /** 从属关系 */
//     private $parent?: IModel.Parent<M>;
//     public get parent() {
//         const parent = this.$parent;
//         if (!parent) throw new Error();
//         return parent;
//     }
//     public get root() {
//         const root = this.app.root;
//         if (!root) throw new Error();
//         return root;
//     }

//     private readonly $hooks: {
//         childList: IModel.ModelHookDict;
//         childDict: IModel.ModelHookDict;
//     };

//     public readonly $childDict: IModel.ChildDict<M>;
//     public readonly $childList: IModel.ChildList<M>;
//     public get childList() { return [ ...this.$childList ]; }
//     public get childDict() { return { ...this.$childDict }; }
//     public get children(): Model[] {
//         return [
//             ...this.childList,
//             ...Object.values(this.childDict)
//         ];
//     }

//     /** 事件触发器/处理器 */

//     public readonly emitterDict: IModel.EmitterDict<IModel.EmitterDefDict<M>>;
//     public readonly updaterDict: IModel.EmitterDict<IModel.StateUpdateBefore<M>>;
//     public readonly watcherDict: IModel.EmitterDict<IModel.StateUpdateDone<M>>;

//     public readonly $handlerDict: IModel.HandlerDict<IModel.HandlerDefDict<M>>;
//     public abstract readonly $handlerCallerDict: IModel.HandlerCallerDict<M>;

//     /** 测试用例 */
//     public debuggerDict: Record<string, IBase.Func>;
//     public readonly stateSetterList: IBase.Func[] = [];
//     public readonly childrenSetterList: IBase.Func[] = [];

//     public $setChildren() {
//         this.childrenSetterList.forEach(setter => {
//             setter(this.children);
//         });
//     }
//     private $setState() {
//         const result = this.currentState;
//         console.log('set_state', result);
//         this.stateSetterList.forEach(setter => {
//             setter(result);
//         });
//     }

//     constructor(
//         config: IModel.BaseConfig<M>,
//         app: App
//     ) {
//         super(app);
//         this.$status = ModelStatus.CREATED;
//         this.$inited = config.inited;

//         console.log('constructor', this.constructor.name);
        
//         /** 基本信息 */
//         this.id = config.id || app.reference.register();
//         this.code = config.code;
//         this.rule = config.rule || {};
        
//         /** 数据结构 */
//         this.$originState = new Proxy(config.originState, {
//             set: (origin, key: IReflect.Key<IModel.State<M>>, value) => {
//                 origin[key] = value;
//                 this.updateState(key);
//                 return true;
//             }
//         });
//         this.$currentState = { ...this.$originState };

//         /** 
//          * 初始化从属关系
//          * 初始化依赖关系
//          */
//         const childList = childListProxy(config.childBundleList, this, this.app);
//         this.$childList = childList.proxy;
//         const childDict = childDictProxy(config.childBundleDict, this, this.app);
//         this.$childDict = childDict.proxy;

//         this.$emitterDictProxy  = new EmitterProxy(config.eventEmitterBundleDict);
//         this.$handlerDictProxy  = new HandlerDictProxy(config.eventHandlerBundleDict);
//         this.$updaterDictProxy  = new EmitterProxy<IModel.StateUpdateBefore<M>>(
//             config.stateUpdaterBundleDict 
//         );
//         this.$watcherDictProxy  = new EmitterProxy<IModel.StateUpdateDone<M>>(
//             config.stateEmitterBundleDict 
//         );

//         this.emitterDict = this.$emitterDictProxy.emitterDict;
//         this.updaterDict = this.$updaterDictProxy.emitterDict;
//         this.watcherDict = this.$watcherDictProxy.emitterDict;
//         this.$handlerDict = this.$handlerDictProxy.handlerDict;

//         this.$hooks = {
//             childDict: childDict.hooks,
//             childList: childList.hooks
//         };

//         /** 调试器 */
//         this.debuggerDict = {};
//     }

//     /** 挂载父节点 */
//     public $bindParent(parent: IModel.Parent<M>) {
//         this.$parent = parent;
//         console.log('bind_parent', this.constructor.name);
//         this.$status = ModelStatus.BINDED;
//         /** 如果父节点从属于根节点，则触发根节点挂载 */
//         if (
//             /** 如果父节点等于自身，则自身为根节点 */
//             this.$parent === this ||
//             this.$parent.status === ModelStatus.MOUNTED 
//         ) {
//             this.$mountRoot();
//         }
//     }

//     /** 挂载根节点 */
//     public $mountRoot() {
//         this.$status = ModelStatus.MOUNTING;
//         console.log('mount_root', this.constructor.name);
//         this.app.reference.modelDict[this.id] = this;
//         this.$hooks.childList.mountRoot();
//         this.$hooks.childDict.mountRoot();
//         this.$emitterDictProxy.mountRoot();
//         this.$updaterDictProxy.mountRoot();
//         this.$watcherDictProxy.mountRoot();
//         this.$handlerDictProxy.mountRoot();
//         this.$status = ModelStatus.MOUNTED;
//     }

//     public $unmountRoot() {
//         this.$status = ModelStatus.UNMOUNTING;
//         console.log('unmount_root', this.constructor.name);
//         this.$hooks.childList.unmountRoot();
//         this.$hooks.childDict.unmountRoot();
//         this.$emitterDictProxy.unmountRoot();
//         this.$updaterDictProxy.unmountRoot();
//         this.$watcherDictProxy.unmountRoot();
//         this.$handlerDictProxy.unmountRoot();
//         delete this.app.reference.modelDict[this.id];
//         this.$status = ModelStatus.UNMOUNTED;
//     }

//     public $unbindParent() {
//         if (this.status === ModelStatus.MOUNTED) {
//             this.$unmountRoot();
//         }
//         console.log('unbind_parent', this.constructor.name);
//         this.$parent = undefined;
//         this.$status = ModelStatus.UNBINDED;
//     }

//     /** 初始化 */
//     public bootDriver() {}
//     public $bootDriver() {
//         if (!this.$inited) {
//             console.log('boot_model', this.constructor.name);
//             this.bootDriver();
//             this.$inited = true;
//         }
//         /** 遍历 */
//         this.$hooks.childList.bootDriver();
//         this.$hooks.childDict.bootDriver();
//     }

//     public unbootDriver() {}
//     public $unbootDriver() {
//         if (this.$inited) {
//             console.log('unboot_model', this.constructor.name);
//             this.unbootDriver();
//             this.$inited = false;
//         }
//         /** 遍历 */
//         this.$hooks.childList.unbootDriver();
//         this.$hooks.childDict.unbootDriver();
//     }

//     /** 更新状态 */
//     public updateState<K extends IReflect.Key<IModel.State<M>>>(key: K) {   
//         const prev = this.$currentState[key];
//         const current = this.$originState[key];
//         const event = {
//             target: this,
//             prev: current,
//             next: current
//         };
//         this.updaterDict[key].emitEvent(event);
//         const next = event.next;
//         if (prev !== next) {
//             this.$currentState[key] = next;
//             if (this.$status === ModelStatus.MOUNTED) {
//                 this.updaterDict[key].emitEvent(event);
//                 this.$setState();
//             }
//         }
//     }

//     /** 序列化函数 */
//     public makeBundle(): IModel.Bundle<M> {
//         return {
//             id: this.id,
//             code: this.code,
//             rule: this.rule,
//             originState: this.$originState,
//             childBundleDict: this.$hooks.childDict.makeBundle(),
//             childBundleList: this.$hooks.childList.makeBundle(),
//             eventEmitterBundleDict: this.$emitterDictProxy.makeBundle(),
//             eventHandlerBundleDict: this.$handlerDictProxy.makeBundle(),
//             stateUpdaterBundleDict: this.$updaterDictProxy.makeBundle(),
//             stateEmitterBundleDict: this.$watcherDictProxy.makeBundle(),
//             inited: true
//         };
//     }
// }