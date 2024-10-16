import { Base, Override } from "..";
import type { Model } from "../../models";
import type { ModelCode } from "./code";

// 模型定义
export type ModelDef = {
    code: ModelCode
    info: Base.Data
    parent: Model | undefined;
    childList: Array<Model>
    childDict: Record<Base.Key, Model>,
    eventDict: Base.Dict,
    reactDict: Base.Dict,
}

export namespace ModelDef {
    // 参数反射
    export type Code<D extends ModelDef> = D['code']
    export type Info<D extends ModelDef> = D['info']
    export type Parent<D extends ModelDef> = D['parent']
    export type ChildDict<D extends ModelDef> = D['childDict']
    export type ChildList<D extends ModelDef> = D['childList']
    export type EventDict<D extends ModelDef> = D['eventDict']
    export type ReactDict<D extends ModelDef> = D['reactDict']
}

// 通用模型定义
export type SpecModelDef<
    D extends Partial<ModelDef>
> = Readonly<
    Override<{
        // 空白模型定义
        info: Base.VoidData,
        parent: Model,
        childList: Base.VoidList,
        childDict: Base.VoidData,
        eventDict: Base.VoidData,
        reactDict: Base.VoidData,
    }, D>
>
