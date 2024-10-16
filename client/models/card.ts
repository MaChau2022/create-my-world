import { SpecModelDef } from "../types/model/define";
import { ModelCode } from "../types/model/code";
import { Model } from ".";
import { ModelConfig } from "../types/model/config";

export type CardModelDef = SpecModelDef<{
    code: ModelCode.Card,
}>


export class CardModel extends Model<CardModelDef> {
    protected _reactDict = {};

    constructor(config: ModelConfig<CardModelDef>) {
        super({
            ...config,
            info: {},
            childDict: {}
        });
    }
}