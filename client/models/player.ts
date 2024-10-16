import { ModelConfig } from "../types/model/config";
import { ModelCode } from "../types/model/code";
import { SpecModelDef } from "../types/model/define";
import { Model } from ".";

export type PlayerModelDef = SpecModelDef<{
    code: ModelCode.Player,
}>


export class PlayerModel extends Model<PlayerModelDef> {
    protected _reactDict = {};
    
    constructor(
        config: ModelConfig<PlayerModelDef>
    ) {
        super({
            ...config,
            childDict: {},
            info: {}
        });
    }
}