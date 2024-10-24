
import { TmplModelDef } from "../type/model/define";
import { TmplModelConfig } from "../type/model/config";
import { PlayerModelDef } from "./player";
import { Model } from ".";
import { useProduct } from "../utils/decor/product";

export type GameModelDef = TmplModelDef<{
    code: 'game',
    childList: [],
    childDict: {
        redPlayer: PlayerModelDef,
        bluePlayer: PlayerModelDef
    }
}>

@useProduct('game')
export class GameModel extends Model<GameModelDef> {
    protected _effectDict = {};

    constructor(config: TmplModelConfig<GameModelDef>) {
        super({
            ...config,
            state: {},
            childDict: {
                redPlayer: config.childDict?.redPlayer || { code: 'player' },
                bluePlayer: config.childDict?.bluePlayer || { code: 'player' }
            }
        });
    }
    
    public readonly methodDict = {};
}
