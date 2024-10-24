import { Model } from ".";
import { TmplModelConfig } from "../type/model/config";
import { TmplModelDef } from "../type/model/define";
import { useProduct } from "../utils/decor/product";

export type PlayerModelDef = TmplModelDef<{
    code: 'player',
}>

@useProduct('player')
export class PlayerModel extends Model<PlayerModelDef> {
    protected _effectDict = {};
    
    constructor(
        config: TmplModelConfig<PlayerModelDef>
    ) {
        super({
            ...config,
            childDict: {},
            state: {}
        });
    }
    
    public readonly methodDict = {};
}