import type { Model } from "../models";
import { Base } from "./base";

export namespace ModelField {
    export type Id<M extends ModelDefinition> = M['id']
    export type Preset<M extends ModelDefinition> = M['preset']
    export type StableState = 'stableState'
    export type UnstableState = 'unstableState'
    export type ChildList = 'childList'
    export type ChildDict = 'childDict'
    export type Parent = 'parent'
    export type EmitIntf = 'emitIntf'
    export type HandleIntf = 'handleIntf' 
}

export type ModelDefinition = {
    id: number
    preset: Base.Data
    stableState: Base.Data
    unstableState: Base.Data
    childList: Array<Model>
    childDict: Record<string, Model>,
    parent: Model | undefined
    emitIntf: Record<string, Base.Function>
    handleIntf: Record<string, Base.Function>
}

export type PureModelDefinition = {
    id: never,
    preset: Base.VoidDict,
    stableState: Base.VoidDict
    unstableState: Base.VoidDict
    childList: Array<never>
    childDict: Base.VoidDict
    parent: Model | undefined
    emitIntf: Base.VoidDict
    handleIntf: Base.VoidDict
}

export type SpecificModelDefinition<
    M extends Partial<ModelDefinition>
> = M & Omit<PureModelDefinition, keyof M>

export type RestrictedModelDefinition<
    M extends Partial<ModelDefinition>
> = M & Omit<ModelDefinition, keyof M>


