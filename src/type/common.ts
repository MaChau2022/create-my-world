import type { BunnyModel } from "../models/bunny";
import { KittyModel } from "../models/kitty";
import { ModelDefinition, SpecificModelDefinition } from "./definition";
import type { Event } from "./event";
import { ModelId } from "./register";

export type PureModelEmitIntf<
    M extends ModelDefinition
> = {
    stateUpdateDone: Event.Of<Event.StateUpdateDone<M>>
    childUpdateDone: Event.Of<Event.ChildUpdateDone<M>>
}

export type BunnyModelDefinition =
    SpecificModelDefinition<{
        id: ModelId.Bunny,
        stableState: {
            name: string
        },
        unstableState: {
            currentAge: number
        },
        childList: BunnyModel[]
    }>

export type KittyModelDefinition = 
    SpecificModelDefinition<{
        id: ModelId.Kitty,
        preset: {
            name?: string,
            color?: string,
        },
        stableState: {
            name: string
            color: string 
        },
        unstableState: {
            currentAge: number
        },
        childDict: {
            zig?: KittyModel,
            zag?: KittyModel
        }
    }>
