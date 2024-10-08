import { KeyOf } from "../type";
import { ModelDef } from "../type/model-def";
import { initAutomicProxy, initReadonlyProxy } from "../utils/proxy";
import { ModelState } from "../debug";
import { 
    Event,
    EventDict, 
    ModifyEventDict,
    UpdateEventDict, 
    SafeEventDict, 
    UpdateSafeEventDict,
    ModifySafeEventDict 
} from "../utils/event";
import { ModelType, PureModelConfig } from "../type/model";
import type { App } from "../app";
import { ModelCode } from "../type/model-reg";
import { React, ReactDict } from "../utils/react";


// 模型层节点
export abstract class Model<
    M extends ModelDef = ModelDef
> {
    // 外部指针
    public readonly app: App;
    public readonly parent: ModelDef.Parent<M>;
    
    // 唯一标识符
    public readonly id: string;
    public readonly code: ModelCode;

    // 数据结构
    protected readonly _originInfo: ModelDef.Info<M>;
    private readonly _actualInfo: ModelDef.Info<M>;
    public readonly actualInfo: ModelDef.Info<M>;

    // 事件依赖关系
    protected abstract readonly _reactDict: ReactDict<M>;
    protected readonly _eventDict: EventDict<M>;
    protected readonly _updateEventDict: UpdateEventDict<M>;
    protected readonly _modifyEventDict: ModifyEventDict<M>;

    // 节点从属关系
    protected readonly _childDict: ModelType.ChildDict<M>;
    protected readonly _childList: ModelType.ChildList<M>;

    // 调试器相关
    public apiDict: Record<string, () => void>;
    private readonly _setterList: Array<(data: ModelState<M>) => void>;

    // 初始化
    private _isActived?: boolean;

    public readonly _getState = (): ModelState<M> => {
        return {
            childDict: this._childDict,
            childList: this._childList,
            eventDict: this._eventDict,
            updateEventDict: this._updateEventDict,
            modifyEventDict: this._modifyEventDict,
            reactDict: this._reactDict,
            info: this.actualInfo
        };
    };

    public readonly _useState = (setter: (data: ModelState<M>) => void) => {
        this._setterList.push(setter);
        return () => {
            const index = this._setterList.indexOf(setter);
            if (index < 0) throw new Error();
            this._setterList.splice(index, 1);
        };
    };

    private readonly _setState = () => {
        for (const useModel of this._setterList) {
            useModel({
                childDict: this._childDict,
                childList: this._childList,
                eventDict: this._eventDict,
                updateEventDict: this._updateEventDict,
                modifyEventDict: this._modifyEventDict,
                reactDict: this._reactDict,
                info: this.actualInfo
            });
        }
    };

    protected readonly _initReactDict = (
        callback: {
            [K in KeyOf<ModelDef.ReactDict<M>>]: (
                event: ModelDef.ReactDict<M>[K]
            ) => void;
        }
    ): ReactDict<M> => {
        return initAutomicProxy(key => {
            console.log(this.constructor.name, key, 'react');
            return new React(
                this.app,
                callback[key].bind(this),
                this._setState
            );
        });
    };
    

    constructor(config: ModelType.BaseConfig<M>) {

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
                set: (target, key: KeyOf<ModelDef.Info<M>>, value) => {
                    target[key] = value;
                    this._updateInfo(key);
                    return true;
                }
            }
        );
        this._actualInfo = { ...this._originInfo };
        this.actualInfo = initReadonlyProxy(this._actualInfo);


        // 初始化事件依赖关系
        this._eventDict = initAutomicProxy(
            (key) => {
                console.log(this.constructor.name, key);
                return new Event(
                    this.app,
                    this._setState
                );
            }
        );
        this._updateEventDict = initAutomicProxy(
            () => new Event(
                this.app,
                this._setState
            )
        );
        this._modifyEventDict = initAutomicProxy(
            key => new Event(
                this.app, 
                () => {
                    this._setState();
                    this._updateInfo(key);
                }
            )
        );

        // 初始化节点从属关系
        const childDict = {} as ModelType.ChildDict<M>;
        Object.keys(config.childDict).forEach((
            key: KeyOf<ModelType.ChildDict<M>>
        ) => {
            childDict[key] = this._unserialize(config.childDict[key]);
        });
        this._childDict = new Proxy(childDict, {
            set: <K extends KeyOf<ModelType.ChildDict<M>>>(
                target: ModelType.ChildDict<M>, 
                key: K, 
                value: ModelType.ChildDict<M>[K]
            ) => {
                target[key] = value;
                value.activate();
                this._setState();
                return true;
            },
            deleteProperty: (target, key: KeyOf<ModelType.ChildDict<M>>) => {
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
            set: (target, key: KeyOf<ModelType.ChildList<M>>, value) => {
                target[key] = value;
                if (typeof key !== 'symbol' && !isNaN(Number(key))) {
                    const model: Model = value;
                    model.activate();
                    this._setState();
                }
                return true;
            },
            deleteProperty: (target, key: KeyOf<ModelType.ChildList<M>>) => {
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
        this.apiDict = {};
        this._setterList = [];
    }

    // 更新状态
    private readonly _updateInfo = (
        key: KeyOf<ModelDef.Info<M>>
    ) => {
        const prev = this._actualInfo[key];
        const current = this._originInfo[key];
        const event = {
            target: this,
            prev: current,
            next: current
        };
        this._modifyEventDict[key].emitEvent(event);
        const next = event.next;
        if (prev !== next) {
            this._actualInfo[key] = next;
            this._updateEventDict[key].emitEvent(event);
            this._setState();
        }
    };

    // 生成反序列化节点
    protected readonly _unserialize = <C extends ModelDef>(
        config: PureModelConfig<C>
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
        const childDict = {} as ModelType.ChildBundleDict<M>;
        Object.keys(this._childDict).forEach((
            key: KeyOf<ModelType.ChildDict<M>>
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
    protected readonly _activate = () => {};
    public readonly activate = () => {
        if (this._isActived) throw new Error();
        this._activate();
        for (const child of this._childList) {
            child.activate();
        }
        for (const key in this._childDict) {
            const child = this._childDict[key];
            child.activate();
        }
        this._isActived = true;
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
            const react = this._reactDict[key];
            react.destroy();
        }
        for (const key in this._eventDict) {
            const event = this._eventDict[key];
            event.destroy();
        }
        this.app.referenceService.unregisterModel(this);
        this._destroy();
    };

}

export abstract class SpecModel<
    M extends ModelDef = ModelDef
> extends Model<M> {
    public readonly childDict: ModelType.SpecChildDict<M>;
    public readonly childList: ModelType.SpecChildList<M>;
    public readonly eventDict: SafeEventDict<M>;
    public readonly updateEventDict: UpdateSafeEventDict<M>;
    public readonly modifyEventDict: ModifySafeEventDict<M>;

    constructor(config: ModelType.BaseConfig<M>) {
        super(config);
        this.childDict = initReadonlyProxy<any>(this._childDict);
        this.childList = initReadonlyProxy<any>(this._childList);
        this.eventDict = initAutomicProxy(key => this._eventDict[key].safeEvent);
        this.updateEventDict = initAutomicProxy(key => this._updateEventDict[key].safeEvent);
        this.modifyEventDict = initAutomicProxy(key => this._modifyEventDict[key].safeEvent);
    }
}