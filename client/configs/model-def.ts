import { Base, Override } from ".";
import type { Model } from "../models";
import type { ModelCode } from "./model-code";

// 模型层节点定义
export type ModelDef = {
    code: ModelCode
    info: Base.Data
    parent: Model | undefined;
    childList: Array<ModelDef>
    childDict: Record<Base.Key, ModelDef>,
    eventDict: Base.Dict,
    reactDict: Base.Dict,
}

export namespace ModelDef {
    // 基础参数反射
    export type Code<M extends ModelDef> = M['code']
    export type Info<M extends ModelDef> = M['info']
    export type Parent<M extends ModelDef> = M['parent']
    export type ChildDict<M extends ModelDef> = M['childDict']
    export type ChildList<M extends ModelDef> = M['childList']
    export type EventDict<M extends ModelDef> = M['eventDict']
    export type ReactDict<M extends ModelDef> = M['reactDict']
}

// 自定义模型层节点定义
export type SpecModelDef<
    M extends Partial<ModelDef>
> = Readonly<Override<{
    // 空模型层节点定义
    info: Base.VoidData,
    parent: Model | undefined,
    childList: Base.VoidList,
    childDict: Base.VoidData
    eventDict: Base.VoidData,
    reactDict: Base.VoidData,
}, M>>

