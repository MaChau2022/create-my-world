import { KeyOf } from "../types";
import { ModelDef } from "../types/model/define";
import { EventInfo } from "../types/event";
import type { React } from "./react";
import type { App } from "../app";

export type EventDict<M extends ModelDef> = {
    [K in KeyOf<ModelDef.EventDict<M>>]: Event<ModelDef.EventDict<M>[K]>;
}

export type ModifyEventDict<M extends ModelDef> = {
    [K in KeyOf<ModelDef.Info<M>>]: Event<
        EventInfo.StateUpdateBefore<M, ModelDef.Info<M>[K]>
    >
}

export type UpdateEventDict<M extends ModelDef> = {
    [K in KeyOf<ModelDef.Info<M>>]: Event<
        EventInfo.StateUpdateDone<M, ModelDef.Info<M>[K]>
    >
}

export namespace Event {
    
}

export class Event<E = any> {
    public readonly id: string;

    private readonly _reactList: React<E>[];
    public get reactIdList() {
        return this._reactList.map(react => react.id);
    }

    public readonly safeEvent: SafeEvent<E>;

    constructor(
        app: App,
        bindDone?: (event: Event<E>) => void
    ) {
        this.id = app.referenceService.ticket;
        this._reactList = [];

        this.safeEvent = {
            id: this.id,
            bindReact: this.bindReact.bind(this),
            unbindReact: this.unbindReact.bind(this)
        };
        this._bindDone = bindDone;
    }

    private readonly _bindDone?: (event: Event<E>) => void; 

    public readonly bindReact = (react: React<E>) => {
        const index = this._reactList.indexOf(react);
        if (index >= 0) return;
        this._reactList.push(react);
        react.bindEvent(this);
        this._bindDone?.(this);
    };

    public readonly unbindReact = (react: React<E>) => {
        const index = this._reactList.indexOf(react);
        if (index < 0) return;
        this._reactList.splice(index, 1);
        react.unbindEvent(this);
        this._bindDone?.(this);
        console.log('unbindReact', this._reactList.length);
    };

    public readonly emitEvent = (event: E): E | void => {
        let prevEvent = event;
        this._reactList.forEach(react => {
            const result = react.handleEvent(prevEvent);
            if (result) prevEvent = result;
        });
        return prevEvent;
    };

    public readonly destroy = () => {
        for (const react of this._reactList) {
            this.unbindReact(react);
        }
    };
}


export type SafeEvent<E = any> = {
    id: string;
    bindReact: (react: React<E>) => void;
    unbindReact: (react: React<E>) => void;
}

export type SafeEventDict<M extends ModelDef> = {
    [K in KeyOf<ModelDef.EventDict<M>>]: 
        SafeEvent<ModelDef.EventDict<M>[K]>;
}

export type ModifySafeEventDict<M extends ModelDef> = {
    [K in KeyOf<ModelDef.Info<M>>]: SafeEvent<
        EventInfo.StateUpdateBefore<M, ModelDef.Info<M>[K]>
    >
}

export type UpdateSafeEventDict<M extends ModelDef> = {
    [K in KeyOf<ModelDef.Info<M>>]: SafeEvent<
        EventInfo.StateUpdateDone<M, ModelDef.Info<M>[K]>
    >
}
