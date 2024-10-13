import { ModelConfig } from "../type/model";
import { ModelCode } from "../type/model-code";
import { SpecModelDef } from "../type/model-def";
import { SpecModel } from "./specific";

export type PlayerModelDef = SpecModelDef<{
    code: ModelCode.Player,
}>


export class PlayerModel extends SpecModel<PlayerModelDef> {
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