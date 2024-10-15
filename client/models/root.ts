import { ModelConfig, PureModelConfig } from "../types/model";
import { SpecModelDef } from "../types/model-def";
import { ModelCode } from "../types/model-code";
import { BunnyModelDef } from "./bunny";
import { SpecModel } from "./specific";
import { TimerModelDef } from "./timer";
import { GameModelDef } from "./game";

export type RootModelDef = SpecModelDef<{
    code: ModelCode.Root,
    info: {
        progress: number,
    },
    childDict: {
        timer: TimerModelDef,
        game?: GameModelDef
    },
    childList: BunnyModelDef[],
    parent: undefined,
}>

export class RootModel extends SpecModel<RootModelDef> {
    protected _reactDict = {};
    
    constructor(config: ModelConfig<RootModelDef>) {
        const childList = config.childList || [];
        if (childList.length === 0) {
            childList.push({
                code: ModelCode.Bunny
            });
        }
        super({
            ...config,
            info: {
                progress: config.info?.progress || 0
            },
            childDict: {
                timer: config.childDict?.timer || {
                    code: ModelCode.Timer
                },
                game: config.childDict?.game
            },
            childList
        });
    }

    public spawnCreature(config: PureModelConfig<BunnyModelDef>) {
        const child = this._unserialize(config);
        console.log(this._childList.push);
        this._childList.push(child);
        return child;
    }

    public killCreature(child: SpecModel<BunnyModelDef>) {
        const index = this._childList.indexOf(child);
        if (index >= 0) {
            this._childList.splice(index, 1);
        }
    }

    public prepareGame() {
        const game = this._unserialize({
            code: ModelCode.Game
        });
        this._childDict.game = game;
        return game;
    }

    public readonly recover = () => {
        this._recRecover();
    };
}
