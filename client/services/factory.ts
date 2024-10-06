import type { App } from "../app";
import type { Model } from "../models";
import { BunnyModel } from "../models/bunny";
import { RootModel } from "../models/root";
import { TimerModel } from "../models/timer";
import { Base } from "../type";
import type { ModelConfig } from "../type/model";
import { ModelDef } from "../type/model-def";
import { singleton } from "../utils/singleton";

/** 模型注册表 */
export enum ModelCode {
    Root = 'root',
    Timer = 'timer',
    Bunny = 'bunny',
}

/** 数据到模型 */
export type ModelRegistry = {
    root: typeof RootModel,
    timer: typeof TimerModel,
    bunny: typeof BunnyModel,
};


@singleton
export class FactoryService {
    public readonly app: App;

    private _productDict: ModelRegistry;

    constructor(app: App) {
        this.app = app;

        this._productDict = {
            root: RootModel,
            timer: TimerModel,
            bunny: BunnyModel
        }; 
    }

    // 生成反序列化节点
    public readonly unserialize = <C extends ModelDef>(
        config: ModelConfig<C>
    ): Model<C> => {
        const Type: Base.Class = this._productDict[config.code];
        return new Type(config);
    };
}