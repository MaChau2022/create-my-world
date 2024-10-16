import { KeyOf, ValueOf } from "..";
import type { Model } from "../../models";
import { ModelDef } from "./define";

// 模型序列化参数
export type ModelBundle<D extends ModelDef> = {
    id: string;
    code: ModelDef.Code<D>,
    info: ModelDef.Info<D>,
    childList: ModelBundle.ChildList<D>,   
    childDict: ModelBundle.ChildDict<D>,
}

export namespace ModelBundle {
    // 模型子节点序列化参数
    export type ChildList<D extends ModelDef> = Array<
        Model.Bundle<ValueOf<ModelDef.ChildList<D>>>
    >

    export type ChildDict<D extends ModelDef> = {
        [K in KeyOf<ModelDef.ChildDict<D>>]: 
            Model.Bundle<ModelDef.ChildDict<D>[K]>
    }
}
