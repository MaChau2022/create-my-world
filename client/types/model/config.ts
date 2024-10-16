import { KeyOf, ValueOf } from "..";
import type { App } from "../../app";
import type { Model } from "../../models";
import { ModelDef } from "./define";

// 模型初始化参数
export type PureModelConfig<M extends ModelDef> = Readonly<{
    id?: string
    code: ModelDef.Code<M>
    info?: Partial<ModelDef.Info<M>>
    childList?: ModelConfig.ChildList<M>,
    childDict?: Partial<ModelConfig.ChildDict<M>>,
}>

export type BaseModelConfig<M extends ModelDef> = {
    id?: string,
    app: App,
    code: ModelDef.Code<M>,
    info: ModelDef.Info<M>,
    parent: ModelDef.Parent<M>,
    childList?: ModelConfig.ChildList<M>,
    childDict: ModelConfig.ChildDict<M>,
}

export type ModelConfig<D extends ModelDef> = 
    PureModelConfig<D> &
    Readonly<{
        app: App,
        parent: ModelDef.Parent<D>
    }>

export namespace ModelConfig {
    // 模型子节点初始化参数
    export type ChildList<D extends ModelDef> = Array<
        Model.Config<ValueOf<ModelDef.ChildList<D>>>
    >

    export type ChildDict<D extends ModelDef> = {
        [K in KeyOf<ModelDef.ChildDict<D>>]: 
            Model.Config<ModelDef.ChildDict<D>[K]>
    }
}
