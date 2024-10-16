
import { SpecModelDef } from "../types/model/define";
import { ModelCode } from "../types/model/code";
import { Model } from ".";
import { ModelConfig } from "../types/model/config";
import { PlayerModel } from "./player";

export type GameModelDef = SpecModelDef<{
    code: ModelCode.Game,
    childList: [],
    childDict: {
        redPlayer: PlayerModel,
        bluePlayer: PlayerModel
    }
}>


export class GameModel extends Model<GameModelDef> {
    protected _reactDict = {};

    constructor(config: ModelConfig<GameModelDef>) {
        super({
            ...config,
            info: {},
            childDict: {
                redPlayer: config.childDict?.redPlayer || {
                    code: ModelCode.Player
                },
                bluePlayer: config.childDict?.bluePlayer || {
                    code: ModelCode.Player
                }
            }
        });
    }
}
