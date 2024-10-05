import { App } from "../app";
import { KeyOf, Optional } from "../type";
import { ModelTmpl } from "../type/model-tmpl";
import { IEffect } from "../type/effect";
import { ISignal } from "../type/signal";
import { ModelType } from "../type/model";
import { initAutomicProxy, initReadonlyProxy } from "../utils/proxy";
import { ModelCode } from "../services/factory";
import { ModelState } from "../debug";

// 模型层节点
export abstract class Model<
    M extends ModelTmpl = ModelTmpl
> {
    // 外部指针
    public readonly app: App;
    public readonly parent: ModelTmpl.Parent<M>;
    
    // 唯一标识符
    public readonly id: string;
    public readonly code: ModelCode;

    // 数据结构
    protected readonly _originInfo: ModelTmpl.Info<M>;
    private readonly _actualInfo: ModelTmpl.Info<M>;
    public readonly actualInfo: ModelTmpl.Info<M>;

    // 事件依赖关系
    protected readonly _eventDict: ISignal.Dict<M>;
    protected abstract readonly _reactDict: IEffect.Dict<M>;

    // 节点从属关系
    protected readonly _childDict: ModelType.Dict<M>;
    protected readonly _childList: ModelType.List<M>;

    // 调试器相关
    public testcaseDict: Record<string, () => void>;
    public readonly setterList: Array<(data: ModelState<M>) => void>;

    public readonly getState = () => {
        return {
            childDict: this._childDict,
            childList: this._childList,
            eventDict: this._eventDict,
            reactDict: this._reactDict,
            info: this.actualInfo
        };
    };

    public readonly useState = (setter: (data: ModelState<M>) => void) => {
        this.setterList.push(setter);
        return () => {
            const index = this.setterList.indexOf(setter);
            if (index < 0) throw new Error();
            this.setterList.splice(index, 1);
        };
    };

    private readonly _setState = () => {
        for (const useModel of this.setterList) {
            useModel({
                childDict: this._childDict,
                childList: this._childList,
                eventDict: this._eventDict,
                reactDict: this._reactDict,
                info: this.actualInfo
            });
        }
    };

    protected readonly _initReactDict = (config: {
        [K in KeyOf<ModelTmpl.ReactDict<M>>]: (
            event: ModelTmpl.ReactDict<M>[K]
        ) => void;
    }): IEffect.Dict<M> => {
        // 事件处理器
        class Effect<E> implements IEffect<E>{
            public readonly modelId: string;
            public readonly eventKey: string;
            public readonly signalList: ISignal<E>[] = [];
            public readonly effectWrap: IEffect.Safe<E>;

            public readonly app: App;
            public readonly model: Model<M>;

            public readonly handleEvent: (event: E) => void;

            constructor(config: {
                model: Model<M>,
                eventKey: string
                handleEvent: (event: E) => void;
            }) {
                this.model = config.model;
                this.modelId = config.model.id;
                this.app = this.model.app;
                this.eventKey = config.eventKey;
                this.handleEvent = config.handleEvent.bind(this.model);
                this.effectWrap = {
                    modelId: this.modelId,
                    eventKey: this.eventKey,
                    handleEvent: this.handleEvent,
                    bindSignal: this.bindSignal.bind(this),
                    unbindSignal: this.unbindSignal.bind(this)
                };
            }

            // 查询事件触发器
            private readonly _findSignal = (
                signalWrap: ISignal.Safe<E>
            ): Optional<ISignal> => {
                const { modelId, eventKey, stateKey } = signalWrap;
                const model = this.app.referenceService.findModel(modelId);
                if (!model) return;
                if (
                    eventKey ==='stateUpdateBefore' ||
                    eventKey ==='stateUpdateDone'
                ) {
                    if (!stateKey) throw new Error();
                    return model._eventDict[eventKey][stateKey];
                }
                return model._eventDict[eventKey];
            };

        
            // 绑定事件触发器
            public readonly bindSignal = (
                signalWrap: ISignal.Safe<E>
            ) => {
                const signal = this._findSignal(signalWrap);
                if (!signal) throw new Error();
                signal.bindEffect(this);
            };

            // 解绑事件触发器
            public readonly unbindSignal = (
                signalWrap: ISignal.Safe<E>
            ) => {
                const signal = this._findSignal(signalWrap);
                if (!signal) throw new Error();
                signal.unbindEffect(this);
            };
            

            public readonly destroy = () => {
                for (const signal of this.signalList) {
                    this.unbindSignal(signal);
                }
            };
        }
        
        return initAutomicProxy(key => (
            new Effect({
                model: this,
                eventKey: key,
                handleEvent: config[key]
            })
        ));
    };

    constructor(config: ModelType.BaseConfig<M>) {
        // 事件触发器
        class Signal<E> implements ISignal<E> {
            public readonly modelId: string;
            public readonly eventKey: string;
            public readonly stateKey?: string;
            public readonly effectList: IEffect<E>[] = [];
            public readonly signalWrap: ISignal.Safe<E>;

            public readonly model: Model<M>;
            public readonly app: App;

            constructor(config: {
                model: Model<M>,
                eventKey: string,
                stateKey?: string
            }) {
                this.model = config.model;
                this.app = this.model.app; 
                this.modelId = config.model.id;
                this.eventKey = config.eventKey;
                this.stateKey = config.stateKey;
                this.signalWrap = {
                    modelId: this.modelId,
                    eventKey: this.eventKey,
                    stateKey: this.stateKey,
                    bindEffect: this.bindEffect.bind(this),
                    unbindEffect: this.unbindEffect.bind(this)
                };
            }

            // 查询事件处理器
            private readonly _findEffect = (
                effectWrap: IEffect.Safe<E>
            ): Optional<IEffect> => {
                const { modelId, eventKey } = effectWrap;
                const model = this.app.referenceService.findModel(modelId);
                if (!model) return;
                return model._reactDict[eventKey];
            };

            // 绑定事件接收器
            public readonly bindEffect = (
                effectWrap: IEffect.Safe<E>
            ) => {
                const effect = this._findEffect(effectWrap);
                if (!effect) throw new Error();
                this.effectList.push(effect);
                effect.signalList.push(this);
                if (this.eventKey === 'stateUpdateBefore') {
                    if (!this.stateKey) throw new Error();
                    this.model._updateInfo(this.stateKey);
                }
                this.model._setState();
            };

            // 解绑事件接收器
            public readonly unbindEffect = (
                effectWrap: IEffect.Safe<E>
            ) => {
                const effect = this._findEffect(effectWrap);
                if (!effect) throw new Error();
                const effectIndex = this.effectList.indexOf(effect);
                const signalIndex = effect.signalList.indexOf(this);
                if (effectIndex < 0) throw new Error();
                if (signalIndex < 0) throw new Error();
                this.effectList.splice(effectIndex, 1);
                effect.signalList.splice(signalIndex, 1);
                this.model._setState();
            };

            // 触发事件
            public readonly emitEvent = (event: E) => {
                for (const effect of this.effectList) {
                    effect.handleEvent(event);
                }
            };

            public readonly destroy = () => {
                for (const effect of this.effectList) {
                    this.unbindEffect(effect);
                }
            };
        }

        // 初始化外部指针
        this.app = config.app;
        this.parent = config.parent;

        // 初始化唯一标识符
        this.id = config.id || this.app.referenceService.ticket;
        this.code = config.code;    
        this.app.referenceService.registerModel(this);

        // 初始化数据结构
        this._originInfo = new Proxy(
            config.info, {
                set: (target, key: KeyOf<ModelTmpl.Info<M>>, value) => {
                    target[key] = value;
                    this._updateInfo(key);
                    return true;
                }
            }
        );
        this._actualInfo = { ...this._originInfo };
        this.actualInfo = initReadonlyProxy(this._actualInfo);


        // 初始化事件依赖关系
        this._eventDict = initAutomicProxy(key => (
            new Signal({
                model: this,
                eventKey: key
            })
        ),
        {
            stateUpdateBefore: initAutomicProxy(key => new Signal({
                model: this,
                eventKey: 'stateUpdateBefore',
                stateKey: key
            })),
            stateUpdateDone: initAutomicProxy(key => new Signal({
                model: this,
                eventKey: 'stateUpdateDone',
                stateKey: key
            }))
        });

        // 初始化节点从属关系
        const childDict = {} as ModelType.Dict<M>;
        Object.keys(config.childDict).forEach((
            key: KeyOf<ModelType.Dict<M>>
        ) => {
            childDict[key] = this._unserialize(config.childDict[key]);
        });
        this._childDict = new Proxy(childDict, {
            set: <K extends KeyOf<ModelType.Dict<M>>>(
                target: ModelType.Dict<M>, 
                key: K, 
                value: ModelType.Dict<M>[K]
            ) => {
                target[key] = value;
                value._initialize();
                this._setState();
                return true;
            },
            deleteProperty: (target, key: KeyOf<ModelType.Dict<M>>) => {
                const value = target[key];
                value._destroy();
                delete target[key];
                this._setState();
                return true;
            }
        });

        const childList = (config.childList || []).map(config => (
            this._unserialize(config)
        ));
        this._childList = new Proxy(childList, {
            set: (target, key: KeyOf<ModelType.List<M>>, value) => {
                target[key] = value;
                if (typeof key !== 'symbol' && !isNaN(Number(key))) {
                    const model: Model = value;
                    model._initialize();
                    this._setState();
                }
                return true;
            },
            deleteProperty: (target, key: KeyOf<ModelType.List<M>>) => {
                const value = target[key];
                if (value instanceof Model) {
                    const model: Model = value;
                    model._destroy();
                    this._setState();
                }
                delete target[key];
                target.length --;
                return true;
            }
        });

        // 初始化调试器
        this.testcaseDict = {};
        this.setterList = [];

        // 初始化根节点业务逻辑
        if (this.parent instanceof App) {
            setTimeout(() => {
                this._initialize();
            });
        }
    }

    // 更新状态
    private readonly _updateInfo = (
        key: KeyOf<ModelTmpl.Info<M>>
    ) => {
        const prev = this._actualInfo[key];
        const current = this._originInfo[key];
        const event = {
            target: this,
            prev: current,
            next: current
        };
        this._eventDict.stateUpdateBefore[key].emitEvent(event);
        const next = event.next;
        if (prev !== next) {
            this._actualInfo[key] = next;
            this._eventDict.stateUpdateDone[key].emitEvent(event);
            this._setState();
        }
    };

    // 生成反序列化节点
    protected readonly _unserialize = <C extends ModelTmpl>(
        config: ModelType.PureConfig<C>
    ): Model<C> => {
        return this.app.factoryService.unserialize({
            ...config,
            parent: this,
            app: this.app
        });
    };

    // 序列化模型层节点
    public readonly serialize = (): ModelType.Bundle<M> => {
        // 序列化事件触发器/处理器字典
        // 序列化从属节点字典/列表
        const childDict = {} as ModelType.BundleDict<M>;
        Object.keys(this._childDict).forEach((
            key: KeyOf<ModelType.Dict<M>>
        ) => {
            const child = this._childDict[key];
            childDict[key] = child.serialize();
        });

        // 返回节点序列化结果
        return {
            id: this.id,
            code: this.code,
            info: this._originInfo,
            childDict,
            childList: this._childList.map(child => (
                child.serialize()
            ))
        };
    };

    // 执行初始化函数
    public readonly initialize = () => {};
    private readonly _initialize = () => {
        this.initialize();
        for (const child of this._childList) {
            child._initialize();
        }
        for (const key in this._childDict) {
            const child = this._childDict[key];
            child._initialize();
        }
    };

    // 执行析构函数
    public readonly destroy = () => {};
    private readonly _destroy = () => {
        for (const child of this._childList) {
            child._destroy();
        }
        for (const key in this._childDict) {
            const child = this._childDict[key];
            child._destroy();
        }
        for (const key in this._reactDict) {
            const effect = this._reactDict[key];
            effect.destroy();
        }
        for (const key in this._eventDict) {
            const signal = this._eventDict[key];
            signal.destroy();
        }
        this.app.referenceService.unregisterModel(this);
        this._destroy();
    };

}

export abstract class SpecModel<
    M extends ModelTmpl = ModelTmpl
> extends Model<M> {
    public readonly childDict: ModelType.SpecDict<M>;
    public readonly childList: ModelType.SpecList<M>;
    public readonly eventDict: ISignal.SafeDict<M>;
    protected readonly reactDict: IEffect.SafeDict<M>;

    constructor(config: ModelType.BaseConfig<M>) {
        super(config);
        this.childDict = initReadonlyProxy(this._childDict);
        this.childList = initReadonlyProxy(this._childList);
        this.eventDict = initAutomicProxy(
            key => this._eventDict[key].signalWrap,
            {
                stateUpdateBefore: initAutomicProxy(key => (
                    this._eventDict.stateUpdateBefore[key].signalWrap
                )),
                stateUpdateDone: initAutomicProxy(key => (
                    this._eventDict.stateUpdateDone[key].signalWrap
                ))
            }
        );
        this.reactDict = initAutomicProxy(
            key => this._reactDict[key].effectWrap
        );
    }
}