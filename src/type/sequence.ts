import type { Model } from "../models";
import { Emitter } from "../utils/emitter";
import { Base, Reflect } from "./base";
import { ModelDefinition, ModelField } from "./definition";
import { PureModelEmitIntf } from "./common";

export namespace ModelReflect {
    export type Sequence<M extends Model | undefined> =
        M extends Model<infer T> ? 
            SpecificModelConfig<T> : undefined

    export type State<
        M extends ModelDefinition
    > = M[ModelField.UnstableState] & Omit<
        M[ModelField.StableState], 
        keyof ModelField.UnstableState
    >

    export type EmitIntf<
        M extends ModelDefinition
    > = PureModelEmitIntf<M> &  Omit<
        M[ModelField.EmitIntf],
        keyof PureModelEmitIntf<M>
    >

    export type EmitterDict<
        M extends ModelDefinition
    > = {
        [K in keyof M[ModelField.EmitIntf]]: Emitter<M[ModelField.EmitIntf][K]>
    }
}


export type ModelSequence<
    M extends ModelDefinition
> = {
    id: ModelField.Id<M>
    key: string
    preset: ModelField.Preset<M>
    unstableState: M[ModelField.UnstableState]
    childSequenceList: 
        ModelReflect.Sequence<Reflect.Iterator<M[ModelField.ChildList]>>[],
    childSequenceDict: { 
        [K in keyof M[ModelField.ChildDict]]: 
            ModelReflect.Sequence<M[ModelField.ChildDict][K]> 
    }
    emitterSequenceDict: { [K in keyof ModelReflect.EmitIntf<M>]?: string[] }
    handlerSequenceDict: { [K in keyof M[ModelField.HandleIntf]]?: string[] }
    updaterSequenceDict: { [K in keyof ModelReflect.State<M>]?: string[] }
}

export type ModelConfig<
    M extends ModelDefinition
> = {
    id: ModelField.Id<M>
    key?: string
    preset: ModelField.Preset<M>
    stableState: M[ModelField.StableState]
    unstableState: M[ModelField.UnstableState]
    emitterSequenceDict?: { [K in keyof ModelReflect.EmitIntf<M>]?: string[] }
    handlerSequenceDict?: { [K in keyof M[ModelField.HandleIntf]]?: string[] }
    updaterSequenceDict?: { [K in keyof ModelReflect.State<M>]?: string[] }
    childSequenceDict: { 
        [K in keyof M[ModelField.ChildDict]]: 
            ModelReflect.Sequence<M[ModelField.ChildDict][K]> 
    }
    childSequenceList: ModelReflect.Sequence<Reflect.Iterator<M[ModelField.ChildList]>>[]
} 

export type SpecificModelConfig<
    M extends ModelDefinition
> = {
    id: ModelField.Id<M>
    key?: string
    preset: ModelField.Preset<M>
    unstableState?: Partial<M[ModelField.UnstableState]>
    childSequenceDict?: Partial<{ 
        [K in keyof M[ModelField.ChildDict]]: 
            ModelReflect.Sequence<M[ModelField.ChildDict][K]> 
    }>
    childSequenceList?: 
        ModelReflect.Sequence<Reflect.Iterator<M[ModelField.ChildList]>>[],
    emitterSequenceDict?: { [K in keyof ModelReflect.EmitIntf<M>]?: string[] }
    handlerSequenceDict?: { [K in keyof M[ModelField.HandleIntf]]?: string[] }
    updaterSequenceDict?: { [K in keyof ModelReflect.State<M>]?: string[] }
}
