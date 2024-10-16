import { CastratableModel } from '../../models/castratable';
import { AnimalFeaturesModel } from '../../models/animal-feature';
import { DeckModel } from '../../models/deck';
import { BunnyModel } from "../../models/bunny";
import { CardModel } from "../../models/card";
import { GameModel } from "../../models/game";
import { PlayerModel } from "../../models/player";
import { RootModel } from "../../models/root";
import { TimerModel } from "../../models/timer";
import { ModelCode } from "./code";

export const MODEL_REGISTRY = {
    // @model-registry
    [ModelCode.Castratable]: CastratableModel,
    [ModelCode.AnimalFeatures]: AnimalFeaturesModel,
    [ModelCode.Deck]: DeckModel,
    [ModelCode.Root]: RootModel,
    [ModelCode.Timer]: TimerModel,
    [ModelCode.Bunny]: BunnyModel,
    [ModelCode.Card]: CardModel,
    [ModelCode.Player]: PlayerModel,
    [ModelCode.Game]: GameModel
}; 

export type ModelRegstry = typeof MODEL_REGISTRY;
