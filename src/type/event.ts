import type { Model } from "../models";
import { Base } from "./base";
import type { ModelDefinition } from "./definition";
import type { ModelReflect } from "./sequence";

export namespace Event {
    export type Of<E extends Base.Dict> = (event: E) => void;

    export type StateUpdateBefore<
        M extends ModelDefinition,
        K extends keyof ModelReflect.State<M>
    > = {
        target: Model<M>,
        next: ModelReflect.State<M>[K],
        prev: ModelReflect.State<M>[K]
    }

    export type StateUpdateDone<
        M extends ModelDefinition
    > = {
        target: Model<M>,
        state: ModelReflect.State<M>
    }

    export type ChildUpdateDone<
        M extends ModelDefinition
    > = {
        target: Model<M>,
        children: Model[]
    }
}