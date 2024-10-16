import { SpecModelDef } from "../types/model/define";
import { ModelCode } from "../types/model/code";
import { Model } from ".";
import { ModelConfig } from "../types/model/config";
import { CardModel } from "./card";

export type DeckModelDef = SpecModelDef<{
    code: ModelCode.Deck,
    childDict: {},
    childList: CardModel[]
}>

export class DeckModel extends Model<DeckModelDef> {
    protected _reactDict = {};

    constructor(config: ModelConfig<DeckModelDef>) {
        super({
            ...config,
            info: {},
            childDict: {}
        });
    }
}
