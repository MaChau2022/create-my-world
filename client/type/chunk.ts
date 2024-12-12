import { OptionalKeys, RequiredKeys } from "utility-types";
import { Base, Dict } from "./base";
import { Model } from "./model";
import { Def } from "./define";

export type Chunk<T extends Def> = {
    code: Def.Code<T>,
    uuid?: string
    childList?: Base.List<Model.Chunk<Def.ChildList<T>[number]>>
    childDict?: Partial<Dict.Strict<Chunk.Dict<Def.ChildDict<T>>>>,
    stateDict?: Partial<Dict.Strict<Def.StateDict<T>>>,
}

export namespace Chunk {
    export type Dict<T extends Base.Dict<Model>> = 
        { [K in RequiredKeys<T>]: Model.Chunk<T[K]> } & 
        { [K in OptionalKeys<T>]?: Model.Chunk<Required<T>[K]> }

    export type Strict<T extends Def> = {
        code: Def.Code<T>,
        uuid: string,
        childDict: Dict.Strict<Chunk.Dict<Def.ChildDict<T>>>,
        childList: Base.List<Model.Chunk<Def.ChildList<T>[number]>>,
        stateDict: Readonly<Dict.Strict<Def.StateDict<T>>>,
    }
}