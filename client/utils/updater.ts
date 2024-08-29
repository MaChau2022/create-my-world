import type { App } from "../app";
import type { Model } from "../models";
import { ModelTmpl } from "../type/template";
import { IEvent } from "../type/event";
import { Emitter } from "./emitter";
import type { Handler } from "./handler";
import { ModelDef } from "../type/definition";
import type { IModel } from "../type/model";

/** 状态修饰器 */
export class Updater<
    M extends ModelTmpl,
    K extends keyof M[ModelDef.State],
> extends Emitter<
    IEvent.StateUpdateBefore<M, K>, 
    Model<M>
> {
    /** 状态键值 */
    public readonly key: K;

    constructor(
        config: IModel.UpdaterConfig<K>,
        parent: Model<M>,
        app: App
    ) {
        super(config, parent, app);
        this.key = config.key;
    }

    public bindHandler(handler: Handler<IEvent.StateUpdateBefore<M, K>>) {
        super.bindHandler(handler);
        this.parent.updateState(this.key);
    }

    public unbindHandler(handler: Handler<IEvent.StateUpdateBefore<M, K>>) {
        super.unbindHandler(handler);
        this.parent.updateState(this.key);
    }
}

