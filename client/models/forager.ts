import { Model } from ".";
import type { App } from "../app";
import { ForagerModelDef } from "../type/definition";
import { ModelType } from "../type/model";
import { ModelKey } from "../type/registry";

export class ForagerModel extends Model<ForagerModelDef> {
    protected $handlerDict: ModelType.HandlerDict<ForagerModelDef> = {
        tickDone: this.handleTimeUpdateDone
    };

    constructor(
        config: ModelType.RawConfig<ForagerModelDef>,
        parent: ForagerModelDef[ModelKey.Parent],
        app: App
    ) {
        super(
            {
                ...config,
                originState: {
                    maxEnergy: 100,
                    energy: config.originState?.maxEnergy || 100,
                    energyWaste: 1,
                    ...config.originState
                },
                childChunkList: [],
                childChunkDict: {}
            }, 
            parent,
            app
        );
    }

    public $initialize(): void {
        if (!this.$inited) {
            const timer = this.root.childDict.time;
            timer.ev.tickDone.bind(this);
        }
        super.$initialize();
    }

    protected handleTimeUpdateDone(): void {
        this.$originState.energy -= this.currentState.energyWaste;
    }
}