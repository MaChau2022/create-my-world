import type { BunnyModel } from "../models/bunny";
import type { ForagerModel } from "../models/forager";
import type { RootModel } from "../models/root";
import type { TimerModel } from "../models/time";

/** 模型定义 */
export enum ModelKey {
    Code = 'code',
    State = 'state',
    Preset = 'preset',
    Parent = 'parent',
    EventDict = 'eventDict',
    ChildDefList = 'childDefList',
    ChildDefDict = 'childDefDict',
    UpdaterDefDict = 'updaterDefDict',
    WatcherDefDict = 'watcherDefDict',
    EmitterDefDict = 'emitterDefDict',
}


/** 模型注册表 */
export enum ModelCode {
    Bunny = 'bunny',
    Root = 'root',
    Time = 'time', 
    Forager = 'forager'
}

/** 数据到模型 */
export type ModelReg = {
    bunny: typeof BunnyModel,
    root: typeof RootModel,
    time: typeof TimerModel,
    forager: typeof ForagerModel
};
