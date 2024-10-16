import { SpecModelDef } from "../types/model/define";
import { ModelCode } from "../types/model/code";
import { ModelConfig } from "../types/model/config";
import type { CastratableModel } from "./castratable";
import type { BunnyModel } from "./bunny";
import { Model } from ".";

export type AnimalFeaturesModelDef = SpecModelDef<{
    code: ModelCode.AnimalFeatures,
    childDict: {
        castratable?: CastratableModel
    },
    parent: BunnyModel 
}>

export class AnimalFeaturesModel extends Model<AnimalFeaturesModelDef> {
    protected _reactDict = {};
 
    constructor(config: ModelConfig<AnimalFeaturesModelDef>) {
        super({
            ...config,
            info: {},
            childDict: {
                castratable: config.childDict?.castratable || {
                    code: ModelCode.Castratable
                }
            }
        });
    }
}
