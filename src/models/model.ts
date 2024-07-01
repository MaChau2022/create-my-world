/* eslint-disable @typescript-eslint/no-unused-vars */

import { BaseData, BaseRecord } from "../types/base";
import { ModelStatus } from "../types/status";
import { modelStatus } from "../utils/status";
import { 
    BaseModel,
    ModelChunk, 
    ModelConfig, 
    ModelEvent
} from "../types/model";
import type { App } from "../app";
import { Exception } from "../utils/exceptions";
import { EventId, EventMap } from "../types/events";
import { ModelId } from "../types/registry";
import { Renderer } from "../renders/base";

export abstract class Model<
    M extends ModelId,
    E extends EventId,
    H extends EventId,
    R extends BaseData,
    I extends BaseData,
    S extends BaseData,
    P extends BaseModel | App
> {
    public readonly app: App;

    public readonly referId: string;
    public readonly modelId: M;

    private _status: ModelStatus;
    public get status() { return this._status; }

    private readonly _rule: R;
    private readonly _info: I;
    private readonly _state: S;

    private readonly _data: R & I & S;
    public get data() { return this._data; }

    private _parent?: P;
    public get parent() { return this._parent; }
    public get children(): BaseModel[] { return []; }

    private readonly _emitters: { [K in ModelEvent<E>]?: string[] };
    private readonly _handlers: { [K in ModelEvent<H>]?: string[] };
    private readonly _renderers: { [K in ModelEvent<H>]?: Renderer<K>[] };

    protected _events: { [K in ModelEvent<H>]: EventMap[K] }; 
    protected abstract _hooks: { [K in ModelEvent<E>]: EventMap[K] }; 

    public constructor(
        config: ModelConfig<M, E, H, R, I, S>, 
        app: App
    ) {
        const proxy = (raw: BaseRecord) => {
            return new Proxy(raw, {
                set: (target, key: string, value) => {
                    target[key] = value;
                    this.update(key);
                    return true;
                }
            });
        };

        this._status = ModelStatus.INITED;

        this.app = app;
        this.modelId = config.modelId;
        this.referId = config.referId || this.app.refer.register();
        
        this._rule = proxy(config.rule);
        this._info = proxy(config.info);
        this._state = proxy(config.state);
        this._data = {
            ...config.rule,
            ...config.info,
            ...config.state
        };

        this._emitters = config.emitters;
        this._handlers = config.handlers;
        this._renderers = {};

        this._events = new Proxy({}, {
            get: (<K extends ModelEvent<H>>(
                target: unknown, 
                key: K
            ) => {
                return (data: unknown) => {
                    const refers = this._handlers[key];
                    const handlers = this.app.refer.list(refers);
                    const renderers = this._renderers[key] || [];
                    for (const handler of handlers) {
                        handler._hooks[key](data);
                    }
                    for (const renderer of renderers) {
                        renderer.hooks[key](data);
                    }
                };
            }) as any
        }) as any;
    }

    protected _handleUpdateDone<
        R extends BaseData,
        I extends BaseData,
        S extends BaseData,
        K extends keyof (R & I & S)
    >(data: {
        target: Model<
            ModelId,
            never,
            never,
            R,
            I,
            S,
            BaseModel | App
        >,
        key: K,
        prev: (R & I & S)[K],
        next: (R & I & S)[K]
    }) {}

    protected _handleCheckBefore<
        R extends BaseData,
        I extends BaseData,
        S extends BaseData,
        K extends keyof (R & I & S)
    >(data: {
        target: Model<
            ModelId,
            never,
            never,
            R,
            I,
            S,
            BaseModel | App
        >,
        key: K,
        prev: (R & I & S)[K],
        next: (R & I & S)[K],
    }): (R & I & S)[K] { 
        return data.prev; 
    }

    
    @modelStatus(
        ModelStatus.MOUNTING,
        ModelStatus.MOUNTED
    )
    public update(key: keyof (R & I & S)) {
        const prev = this._data[key];
        const result = {
            ...this._rule,
            ...this._info,
            ...this._state
        }[key];
        const data = {
            target: this,
            key,
            prev: result,
            next: result
        };
        
        this._events[EventId.CHECK_BEFORE](data);
        this._data[key] = data.next;
        if (prev !== data.next) {
            this._events[EventId.UPDATE_DONE]({
                target: this,
                key,
                prev,
                next: data.next
            });
        }
    }

    @modelStatus(ModelStatus.INITED)
    public mount(parent: P) {
        this._status = ModelStatus.MOUNTING;
        this.app.refer.add(this);
        for (const child of this.children) child.mount(this);
        for (const key in this._rule) this.update(key); 
        for (const key in this._info) this.update(key); 
        for (const key in this._state) this.update(key); 
        this._parent = parent;
        this._status = ModelStatus.MOUNTED;
    }

    @modelStatus(ModelStatus.MOUNTED)
    public unmount() {
        this._status = ModelStatus.UNMOUNTING;
        for (const child of this.children) child.unmount();
        this.app.refer.remove(this);
        this._parent = undefined; 
        this._status = ModelStatus.UNMOUNTED; 
    }

    @modelStatus(ModelStatus.MOUNTED)
    public bind<K extends ModelEvent<H>>(
        key: K,
        that: Renderer<K>
    ) {
        let renderers = this._renderers[key];
        if (!renderers) renderers = this._renderers[key] = [];
        renderers.push(that);
    }

    @modelStatus(ModelStatus.MOUNTED)
    public unbind<K extends ModelEvent<H>>(
        key: K,
        that: Renderer<K>
    ) {
        const renderers = this._renderers[key];
        if (!renderers) throw new Exception();
        renderers.splice(renderers.indexOf(that), 1);
    }

    @modelStatus(ModelStatus.MOUNTED)
    public hook<K extends ModelEvent<H>>(
        key: K,
        that: Model<
            number,
            K,
            never,
            BaseData,
            BaseData,
            BaseData,
            BaseModel | App
        >
    ) {
        let emitters = that._emitters[key];
        let handlers = this._handlers[key];

        if (!emitters) emitters = that._emitters[key] = [];
        if (!handlers) handlers = this._handlers[key] = [];

        emitters.push(this.referId);
        handlers.push(that.referId);
    }

    @modelStatus(ModelStatus.MOUNTED)
    public unhook<K extends ModelEvent<H>>(
        key: K,
        that: Model<
            number,
            K,
            never,
            BaseData,
            BaseData,
            BaseData,
            BaseModel | App
        >
    ) {
        const emitters = that._emitters[key];
        const handlers = this._handlers[key];
        
        if (!emitters || !handlers) throw new Exception();

        emitters.splice(emitters.indexOf(this.referId), 1);
        handlers.splice(handlers.indexOf(that.referId), 1);
    }

    @modelStatus(
        ModelStatus.INITED,
        ModelStatus.MOUNTED
    )
    public serialize(): ModelChunk<M, E, H, R, S> {
        return {
            modelId: this.modelId,
            referId: this.referId,
            rule: this._rule,
            state: this._state,
            emitters: this._emitters,
            handlers: this._handlers
        };
    }
}
