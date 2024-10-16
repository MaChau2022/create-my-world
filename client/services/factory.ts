import type { App } from "../app";
import type { Model } from "../models";
import { Base } from "../types";
import type { ModelConfig } from "../types/model/config";
import { MODEL_REGISTRY } from "../types/model/registry";
import { ModelDef } from "../types/model/define";
import { singleton } from "../utils/singleton";


@singleton
export class FactoryService {
    public readonly app: App;

    constructor(app: App) {
        this.app = app;
    }

    // 生成反序列化节点
    public readonly unserialize = <C extends ModelDef>(
        config: ModelConfig<C>
    ): Model<C> => {
        const Type: Base.Class = MODEL_REGISTRY[config.code];
        return new Type(config);
    };
}