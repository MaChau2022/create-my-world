import { Base } from "./base";
import { ModelDefinition } from "./definition";

export namespace Reflect {
    export type Iterator<L extends any[]> = L[number]
    export type Value<M extends Base.Dict> = M[keyof M]
}

export namespace ModelReflect {
    export type Id<M extends ModelDefinition> = M['id']
    export type Preset<M extends ModelDefinition> = M['preset']
    export type StableState<M extends ModelDefinition> = M['stableState']
    export type UnstableState = 'unstableState'
    export type ChildList = 'childList'
    export type ChildDict = 'childDict'
    export type Parent = 'parent'
    export type EmitIntf = 'emitIntf'
    export type HandleIntf = 'handleIntf' 
}