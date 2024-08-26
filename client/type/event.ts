import type { Model } from "../models";
import { Emitter } from "../utils/emitter";
import { Handler } from "../utils/handler";
import { Base } from ".";
import type { ModelTmpl } from "./template";
import { ModelDef } from "./definition";

export namespace EventReflect {
    export type ExecuteFunc<E> = (event: E) => void;
    export type BindFunc<E> = (handler: Handler<E>) => void
    export type EmitterDict<D extends Base.Dict> = { [K in keyof D]: Emitter<D[K]> }
    export type HandlerDict<D extends Base.Dict> = { [K in keyof D]: Handler<D[K]> }
    export type ExecuteIntf<D extends Base.Dict> = { [K in keyof D]: ExecuteFunc<D[K]> }
    export type BindIntf<D extends Base.Dict> = { [K in keyof D]: BindFunc<D[K]> }
    export type ChunkDict<D extends Base.Dict> = { [K in keyof D]?: string[] }
}

export namespace Event {
    export type StateUpdateBefore<
        M extends ModelTmpl,
        K extends keyof M[ModelDef.State]
    > = {
        target: Model<M>,
        next: M[ModelDef.State][K],
        prev: M[ModelDef.State][K]
    }

    export type StateUpdateDone<
        M extends ModelTmpl
    > = {
        target: Model<M>,
        state: M[ModelDef.State]
    }

    export type ChildUpdateDone<
        M extends ModelTmpl
    > = {
        target: Model<M>,
        children: Model[]
    }
}