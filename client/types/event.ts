import type { Model } from "../models";
import { ModelDef } from "./model/define";

export namespace EventInfo {
    export type StateUpdateBefore<
        M extends ModelDef, T
    > = {
        target: Model<M>,
        prev: T,
        next: T,
        isAborted?: boolean
    }
        
    export type StateUpdateDone<
        M extends ModelDef, T
    > = {
        target: Model<M>,
        next: T,
        prev: T,
    }

    export type CastrateBefore<M extends Model> = {
        model: M,
        isAborted?: boolean
    }

    export type CastrateDone<M extends Model> = {
        model: M,
    }
}
