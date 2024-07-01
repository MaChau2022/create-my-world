import type { App } from "../app";
import type { Model } from "../models/model";
import { BaseData } from "./base";
import type { BaseModel } from "./model";
import { ModelId } from "./registry";

enum EventId {
    CHECK_BEFORE,
    UPDATE_DONE,
    PING_DONE,
    PONG_DONE,
}

type EventMap = { 
    [EventId.CHECK_BEFORE]: 
        <
            R extends BaseData,
            I extends BaseData,
            S extends BaseData,
            K extends keyof (R & I & S)
        >(data: {
            target: Model<
                ModelId,
                never,
                never,
                R,
                I,
                S,
                BaseModel | App
            >,
            key: K,
            prev: (R & I & S)[K],
            next: (R & I & S)[K],
        }) => void,

    [EventId.UPDATE_DONE]: 
        <
            R extends BaseData,
            I extends BaseData,
            S extends BaseData,
            K extends keyof (R & I & S)
        >(data: {
            target: Model<
                ModelId,
                never,
                never,
                R,
                I,
                S,
                BaseModel | App
            >,
            key: K,
            prev: (R & I & S)[K],
            next: (R & I & S)[K]
        }) => void,

    [EventId.PING_DONE]: (data: any) => void,
    
    [EventId.PONG_DONE]: (data: any) => void,
}

export {
    EventId,
    EventMap
};
