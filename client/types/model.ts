import type { Model } from "../models/base";
import { BaseFunction, BaseRecord, BaseType } from "./base";
import { CheckBeforeEvent, EventId, UpdateDoneEvent } from "./events";

type BaseModel = Model<
    number,
    BaseRecord,
    BaseRecord,
    BaseRecord,
    BaseEvent,
    BaseEvent,
    BaseModel,
    BaseModelList,
    BaseModelDict
>;

type BaseModelList = Array<BaseModel>
type BaseModelDict = Record<string, BaseModel>;
type BaseEvent = Record<string, BaseFunction>

type ModelEvent<
    E extends BaseEvent
> = E & {
    [EventId.CHECK_BEFORE]: CheckBeforeEvent, 
    [EventId.UPDATE_DONE]: UpdateDoneEvent,
}

type ListChunk<L extends BaseModelList> = ChunkOf<L[number]>[];
type DictChunk<D extends BaseModelDict> = { [K in keyof D]: ChunkOf<D[K]> }
type ConsumerChunk<H extends BaseEvent> = { [K in keyof H]?: string[] }
type ProviderChunk<E extends BaseEvent> = { 
    [K in keyof ModelEvent<E>]?: string[] 
}

type ModelChunk<
    M extends number,
    R extends BaseRecord,
    S extends BaseRecord,
    E extends BaseEvent,
    H extends BaseEvent,
    L extends BaseModelList,
    D extends BaseModelDict,
> = {
    referId: string,
    modelId: M,
    rule: R,
    stat: S,
    list: ListChunk<L>,
    dict: DictChunk<D>
    provider: ProviderChunk<E>
    consumer: ConsumerChunk<H>,
}

type ModelStruct<
    M extends number,
    R extends BaseRecord,
    I extends BaseRecord,
    S extends BaseRecord,
    E extends BaseEvent,
    H extends BaseEvent,
    L extends BaseModelList,
    D extends BaseModelDict,
> = {
    modelId: M;
    referId?: string;
    rule: R;
    stat: S;
    info: I,
    list: L,
    dict: D
    provider: ProviderChunk<E>
    consumer: ConsumerChunk<H>,
    handlers: H,
}

type ModelConfig<
    R extends BaseRecord,
    S extends BaseRecord,
    E extends BaseEvent,
    H extends BaseEvent,
    L extends BaseModel[],
    D extends Record<string, BaseModel>
> = {
    referId?: string;
    rule: R;
    stat?: Partial<S>
    dict?: Partial<D>
    list?: L,
    provider?: ProviderChunk<E>
    consumer?: ConsumerChunk<H>,
}

type ChunkOf<T extends BaseModel | undefined> = 
    T extends BaseModel ? 
    ReturnType<T['serialize']> : 
    undefined;

export {
    BaseModel,
    BaseEvent,
    BaseModelDict as BaseDict,
    BaseModelList as BaseList,

    DictChunk,
    ListChunk,
    ProviderChunk,
    ConsumerChunk,

    ModelChunk,
    ModelEvent,
    ModelStruct,
    ModelConfig,

    ChunkOf
};