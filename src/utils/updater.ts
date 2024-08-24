import type { App } from "../app";
import type { Model } from "../models";
import { ModelDefinition } from "../type/definition";
import { Event } from "../type/event";
import { ModelReflect } from "../type/sequence";
import { Emitter } from "./emitter";
import type { Handler } from "./handler";

export class Updater<
    M extends ModelDefinition,
    K extends keyof ModelReflect.State<M>,
> extends Emitter<
    Event.Of<Event.StateUpdateBefore<M, K>>, 
    Model<M>
> {
    public readonly stateKey: K;

    constructor(
        key: K,
        config: string[],
        parent: Model<M>,
        app: App
    ) {
        super(config, parent, app);
        this.stateKey = key;
    }

    public bind(target: Handler<
        Event.Of<Event.StateUpdateBefore<M, K>>
    >) {
        super.bind(target);
        this.parent.updateState(this.stateKey);
    }

    public unbind(target: Handler<
        Event.Of<Event.StateUpdateBefore<M, K>>
    >) {
        super.unbind(target);
        this.parent.updateState(this.stateKey);
    }
}
