import type { Model } from "../models";
import { BaseModelDef } from "./definition";
import { IModel } from "./model";
import { ModelKey } from "./registry";

export namespace EventType { 
    export type StateUpdateBefore<
        M extends BaseModelDef,
        K extends keyof M[ModelKey.State] = keyof M[ModelKey.State]
    > = {
        // target: InstanceType<ModelReg[M[ModelKey.Code]]>,
        target: Model<M>,
        next: M[ModelKey.State][K],
        prev: M[ModelKey.State][K]
    }

    export type StateUpdateDone<
        M extends BaseModelDef,
        K extends keyof M[ModelKey.State] = keyof M[ModelKey.State]
    > = {
        // target: InstanceType<ModelReg[M[ModelKey.Code]]>
        target: Model<M>,
        next: M[ModelKey.State][K],
        prev: M[ModelKey.State][K]
    }

    export type ChildUpdateDone<
        M extends BaseModelDef,
    > = {
        // target: InstanceType<ModelReg[M[ModelKey.Code]]>
        target: Model<M>,
        list: IModel.ChildList<M>
        dict: IModel.ChildDict<M>
        children: Model[],
        child: Model,
    }
}