import type { App } from "../app";
import { Model } from "../models";
import { Base } from "../type/base";
import { ModelReflect } from "../type/sequence";

export class FactoryService {
    public readonly app: App;

    constructor(app: App) {
        this.app = app;
    }

    private static $productDict: Record<number, Base.Class> = {

    }; 

    public unserialize<M extends Model>(
        config: ModelReflect.Sequence<M>,
        parent: any
    ): M {
        const Constructor = FactoryService.$productDict[config.id];
        return new Constructor(config, parent, this.app);
    }
}