import type { App } from "../app";
import { KeyOf } from "../types";
import { ModelDef } from "../types/model/define";
import { SafeEvent } from "./event";

export type ReactDict<M extends ModelDef> = {
    [K in KeyOf<ModelDef.ReactDict<M>>]: 
        React<ModelDef.ReactDict<M>[K]>
}

export class React<E = any> {
    public readonly id: string;

    private readonly _eventList: SafeEvent<E>[] = [];
    public get eventIdList() {
        return this._eventList.map(event => event.id);
    }

    constructor(
        app: App,
        handleEvent: (event: E) => E | void,
        bindDone?: () => void
    ) {
        this.id = app.referenceService.ticket;
        this.handleEvent = handleEvent;
        this._bindDone = bindDone;
    }

    private readonly _bindDone?: (react: React<E>) => void;
    public readonly handleEvent: (event: E) => E | void;
    
    public readonly bindEvent = (event: SafeEvent<E>) => {
        const index = this._eventList.indexOf(event);
        if (index >= 0) return;
        this._eventList.push(event);
        event.bindReact(this);
        this._bindDone?.(this);
    };

    public readonly unbindEvent = (event: SafeEvent<E>) => {
        const index = this._eventList.indexOf(event);
        if (index < 0) return;
        this._eventList.splice(index, 1);
        event.unbindReact(this);
        this._bindDone?.(this);
    };

    public readonly destroy = () => {
        for (const event of this._eventList) {
            this.unbindEvent(event);
        }
    };
}
