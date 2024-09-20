/* eslint-disable max-len */
import type { Model } from "../models";
import type { IEvent } from "./event";
import { IBase, IReflect } from ".";
import type { ModelCode, ModelReg } from "./registry";
import { Emitter, Handler } from "../utils/emitter";

/** 模型 */
export namespace IModel {
    /** 基础模型定义 */
    export type Define = {
        code: ModelCode
        rule: IBase.Data
        state: IBase.Data
        parent: Model;
        childDefList: Array<Define>
        childDefDict: Record<IBase.Key, Define>,
        emitterDefDict: IBase.Dict,
        handlerDefDict: IBase.Dict,
    }
    export type PureDefine = {
        code: never,
        rule: {},
        state: {}
        parent: Model
        childDefList: []
        childDefDict: {}
        emitterDefDict: {},
        handlerDefDict: {},
    }

    /** 通用模型定义 */
    export type CommonDefine<M extends Partial<Define>> = 
        M & Omit<PureDefine, keyof M>

    /** 模型定义反射 */
    export type Code<M extends Define> = M['code']
    export type Rule<M extends Define> = M['rule']
    export type State<M extends Define> = M['state']
    export type Parent<M extends Define> = M['parent']
    export type ChildDefList<M extends Define> = M['childDefList']
    export type ChildDefDict<M extends Define> = M['childDefDict']
    export type EmitterDefDict<M extends Define> = M['emitterDefDict']
    export type HandlerDefDict<M extends Define> = M['handlerDefDict']

    /** 
     * 事件触发器/处理器定义
     * 事件触发器/处理器序列化参数集合
     */
    export type EventHandlerBundleDict<M extends Define> = {
        [K in IReflect.Key<HandlerDefDict<M>>]?: [string, string][]
    }
    export type EventEmitterBundleDict<M extends Define> = {
        [K in IReflect.Key<EmitterDefDict<M>>]?: [string, string][]
    } & {
        [K in IReflect.Key<State<M>> as `${K}UpdateBefore`]?: [string, string][]
    } & {
        [K in IReflect.Key<State<M>> as `${K}UpdateDone`]?: [string, string][]
    }
    /** 事件触发器/处理器集合 */
    export type EmitterDict<M extends Define> = {
        [K in IReflect.Key<EmitterDefDict<M>>]: Emitter<EmitterDefDict<M>[K]>
    } & {
        [K in IReflect.Key<State<M>> as `${K}UpdateBefore`]: Emitter<IEvent.StateUpdateBefore<M, K>>
    } & {
        [K in IReflect.Key<State<M>> as `${K}UpdateDone`]: Emitter<IEvent.StateUpdateDone<M, K>>
    }
    export type HandlerDict<M extends Define> = {
        [K in IReflect.Key<HandlerDefDict<M>>]: Handler<HandlerDefDict<M>[K]>
    }
    /** 事件处理器函数集合 */
    export type HandlerFuncDict<M extends Define> = {
        [K in IReflect.Key<HandlerDefDict<M>>]: (event: HandlerDefDict<M>[K]) => void
    }

    /** 模型序列化参数 */
    export type Bundle<
        M extends Define = Define
    > = {
        id: string
        activated: true
        code: Code<M>
        rule: Partial<Rule<M>>
        originState: State<M>
        childBundleList: ChildBundleList<M>,
        childBundleDict: ChildBundleDict<M>,
        emitterBundleDict: EventEmitterBundleDict<M>,
        handlerBundleDict: EventHandlerBundleDict<M>,
    }

    /** 模型初始化参数 */
    export type BaseConfig<
        M extends Define = Define
    > = {
        id?: string
        activated?: boolean
        code: Code<M>
        rule?: Partial<Rule<M>>
        originState: State<M>
        childBundleList: ChildConfigList<M>,
        childBundleDict: ChildConfigDict<M>,
        emitterBundleDict?: EventEmitterBundleDict<M>,
        handlerBundleDict?: EventHandlerBundleDict<M>,
    }
    export type Config<
        M extends Define = Define
    > = {
        id?: string
        activated?: boolean
        code: Code<M>
        rule?: Partial<Rule<M>>
        originState?: Partial<State<M>>
        childBundleList?: ChildConfigList<M>,
        childBundleDict?: Partial<ChildConfigDict<M>>,
        emitterBundleDict?: Partial<EventEmitterBundleDict<M>>,
        handlerBundleDict?: Partial<EventHandlerBundleDict<M>>,
    }

    /** 从属模型集合/列表 */
    export type ChildDict<M extends Define> = {
        [K in keyof ChildDefDict<M>]: InstanceType<ModelReg[Code<ChildDefDict<M>[K]>]>
    }
    export type ChildList<M extends Define> =
        Array<InstanceType<ModelReg[Code<IReflect.Iterator<ChildDefList<M>>>]>>
    

    /** 从属模型序列化参数集合/列表 */
    export type ChildBundleDict<M extends Define> = {
        [K in keyof ChildDefDict<M>]: IModel.Bundle<ChildDefDict<M>[K]>
    }
    export type ChildBundleList<M extends Define> = 
        Array<IModel.Bundle<IReflect.Iterator<ChildDefList<M>>>>

    /** 从属模型初始化参数集合/列表 */
    export type ChildConfigDict<M extends Define> = {
        [K in keyof ChildDefDict<M>]: IModel.Config<ChildDefDict<M>[K]>
    }
    export type ChildConfigList<M extends Define> = 
        Array<IModel.Config<IReflect.Iterator<ChildDefList<M>>>>
}

