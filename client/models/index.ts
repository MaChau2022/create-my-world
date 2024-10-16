import { KeyOf } from "../types";
import { ModelDef } from "../types/model/define";
import type { ModelState } from "../debug";
import { React, ReactDict } from "../utils/react";
import { 
    Event,
    EventDict, 
    ModifyEventDict,
    ModifySafeEventDict,
    SafeEventDict,
    UpdateEventDict, 
    UpdateSafeEventDict
} from "../utils/event";
import { 
    BaseModelConfig,
    ModelConfig,
    PureModelConfig
} from "../types/model/config";
import type { App } from "../app";
import { ModelBundle } from "../types/model/bundle";
import { Proxy } from "../utils/proxy";
import { ModelRegstry } from "../types/model/registry";

export namespace Model {
    export type Code<M extends Model> = M['code']
    export type Bundle<M extends Model> = M['bundle']
    export type Config<M extends Model | undefined> = 
        M extends Model ? M['config'] : undefined
}

// 模型基类
export abstract class Model<
    D extends ModelDef = any
> {
    // 唯一标识符
    public readonly id: string;
    public readonly code: ModelDef.Code<D>;

    // 从属相关
    public readonly app: App;
    public readonly parent: ModelDef.Parent<D>;
    protected readonly _childDict: ModelDef.ChildDict<D>;
    protected readonly _childList: ModelDef.ChildList<D>;

    public readonly childDict: ModelDef.ChildDict<D>;
    public readonly childList: ModelDef.ChildList<D>;

    // 事件相关
    // 封装的事件触发器
    public readonly eventDict: SafeEventDict<D>;
    public readonly updateEventDict: UpdateSafeEventDict<D>;
    public readonly modifyEventDict: ModifySafeEventDict<D>;
    
    // 事件触发器
    protected readonly _eventDict: EventDict<D>;
    protected readonly _updateEventDict: UpdateEventDict<D>;
    protected readonly _modifyEventDict: ModifyEventDict<D>;

    // 事件处理器
    protected abstract readonly _reactDict: ReactDict<D>;

    // 初始化事件处理器
    protected readonly _initReactDict = (
        callback: {
            [K in KeyOf<ModelDef.ReactDict<D>>]: (
                event: ModelDef.ReactDict<D>[K]
            ) => void | ModelDef.ReactDict<D>[K];
        }
    ): ReactDict<D> => {
        return Proxy.automicDict(key => {
            return new React(
                this.app,
                callback[key].bind(this),
                this._emitSetter
            );
        });
    };


    constructor(config: BaseModelConfig<D>) {
        this.app = config.app;
        this.parent = config.parent;
        
        this.id = config.id || this.app.referenceService.ticket;
        this.code = config.code;    
        this.app.referenceService.registerModel(this);

        this._originInfo = Proxy.controlledDict(
            config.info,
            this._updateInfo,
            this._updateInfo
        );
        this._actualInfo = { ...this._originInfo };
        this.actualInfo = Proxy.readonlyDict(this._actualInfo);
        
        this.eventDict = Proxy.automicDict(key => this._eventDict[key].safeEvent);
        this.updateEventDict = Proxy.automicDict(key => this._updateEventDict[key].safeEvent);
        this.modifyEventDict = Proxy.automicDict(key => this._modifyEventDict[key].safeEvent);

        this._eventDict = Proxy.automicDict(() => new Event(this.app, this._emitSetter));
        this._updateEventDict = Proxy.automicDict(() => new Event(this.app, this._emitSetter));
        this._modifyEventDict = Proxy.automicDict(key => new Event(
            this.app, () => {
                this._emitSetter();
                this._updateInfo(key);
            }
        ));


        // 初始化节点从属关系
        const childDict = {} as ModelDef.ChildDict<D>;
        Object.keys(config.childDict).forEach(<
            K extends KeyOf<ModelDef.ChildDict<D>>
        >(key: K) => {
            if (!config.childDict[key]) return;
            childDict[key] = this.app.factoryService.unserialize({
                ...config.childDict[key],
                parent: this,
                app: this.app
            }) as any;    
        });
        
        this._childDict = Proxy.controlledDict(
            childDict,
            (key, value) => {
                value._activateAll();
                this._emitSetter();
            },
            (key, value) => {
                value._destroyAll();
                this._emitSetter();
            }
        );
        this._childList = Proxy.controlledList(
            (config.childList || []).map(config => (
                this.app.factoryService.unserialize({
                    ...config,
                    parent: this,
                    app: this.app
                })
            )),
            value => {
                value._activateAll();
                this._emitSetter();
            },
            value => {
                value._destroyAll();
                this._emitSetter();
            }
        );
        this.childDict = Proxy.readonlyDict(this._childDict);
        this.childList = Proxy.readonlyDict(this._childList);

        // 初始化调试器
        this._setterList = [];
    }

    // 数据层相关
    protected readonly _originInfo: ModelDef.Info<D>;
    private readonly _actualInfo: ModelDef.Info<D>;
    public readonly actualInfo: ModelDef.Info<D>;

    private readonly _updateInfo = (
        key: KeyOf<ModelDef.Info<D>>
    ) => {
        console.log('update info', key);
        const prev = this._actualInfo[key];
        const current = this._originInfo[key];
        const result = this._modifyEventDict[key].emitEvent({
            target: this,
            prev: current,
            next: current
        });
        if (!result) return;
        const next = result.next;
        if (next && prev !== next) {
            this._actualInfo[key] = next;
            this._updateEventDict[key].emitEvent({
                target: this,
                prev,
                next
            });
            this._emitSetter();
        }
    };


    // 初始化参数
    public get config(): PureModelConfig<D> {
        const childDict = {} as ModelConfig.ChildDict<D>;
        for (const key in this._childDict) {
            const child = this._childDict[key];
            if (!child) continue;
            childDict[key] = child.config as any;
        }
        return {
            code: this.code,
            info: this._originInfo,
            childDict,
            childList: this._childList.map(child => child.config) as any
        };
    }

    // 序列化参数
    public get bundle(): ModelBundle<D> {
        const childDict = {} as ModelBundle.ChildDict<D>;
        Object.keys(this._childDict).forEach((
            key: KeyOf<ModelDef.ChildDict<D>>
        ) => {
            const child = this._childDict[key];
            if (!child) return;
            childDict[key] = child.bundle;
        });
        return {
            id: this.id,
            code: this.code,
            info: this._originInfo,
            childDict,
            childList: this._childList.map(child => child.bundle)
        };
    }
    
    // 生命周期相关
    private _isActivated?: boolean;
    private _isDestroyed?: boolean;
    
    protected readonly _activate = () => {};
    protected readonly _destroy = () => {};

    // 节点复位
    protected readonly _activateAll = () => {
        if (this._isActivated) throw new Error();
        this._activate();
        // 复位子节点
        for (const child of this._childList) {
            child._activateAll();
        }
        for (const key in this._childDict) {
            const child = this._childDict[key];
            child._activateAll();
        }
        this._isActivated = true;
    };

    // 节点销毁
    private readonly _destroyAll = () => {
        if (this._isDestroyed) throw new Error();
        // 销毁子节点
        for (const child of this._childList) {
            child._destroyAll();
        }
        for (const key in this._childDict) {
            const child = this._childDict[key];
            child._destroyAll();
        }
        // 事件解除绑定
        for (const key in this._reactDict) {
            const react = this._reactDict[key];
            react.destroy();
        }
        for (const key in this._eventDict) {
            const event = this._eventDict[key];
            event.destroy();
        }
        for (const key in this._updateEventDict) {
            const event = this._updateEventDict[key];
            event.destroy();
        }
        for (const key in this._modifyEventDict) {
            const event = this._modifyEventDict[key];
            event.destroy();
        }
        this._destroy();
        this.app.referenceService.unregisterModel(this);
        this._isDestroyed = true;
    };


    // 调试器相关
    private readonly _setterList: Array<(data: ModelState<D>) => void>;
    
    // 挂载调试器
    public readonly addSetter = (
        hook: (data: ModelState<D>) => void
    ) => {
        this._setterList.push(hook);
        this._emitSetter();
        // 卸载调试器
        return () => {
            const index = this._setterList.indexOf(hook);
            if (index < 0) throw new Error();
            this._setterList.splice(index, 1);
        };
    };
    
    // 触发调试器
    private readonly _emitSetter = () => {
        for (const hook of this._setterList) {
            hook({
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


    protected readonly _unserialize = <
        C extends ModelDef.Code<M>,
        M extends ModelDef
    >(
        config: PureModelConfig<M> & { code: C }
    ): InstanceType<ModelRegstry[C]> => {
        return this.app.factoryService.unserialize({
            ...config,
            parent: this,
            app: this.app
        }) as InstanceType<ModelRegstry[ModelDef.Code<M>]>;
    };
}

