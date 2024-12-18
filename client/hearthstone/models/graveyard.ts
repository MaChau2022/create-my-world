import { CardModel } from "./card";
import { PlayerModel } from "./player";
import { Def, Factory, Model, NodeModel, Props, Validator } from "@/set-piece";

type GraveyardDef = Def.Create<{
    code: 'graveyard',
    stateDict: {},
    paramDict: {},
    childList: CardModel[],
    eventDict: {
        onCardAccess: [CardModel];
        onCardRemove: [CardModel];
    },
    parent: PlayerModel
}>

@Factory.useProduct('graveyard')
export class GraveyardModel extends NodeModel<GraveyardDef> {
    constructor(props: Props<GraveyardDef>) {
        super({
            childList: [],
            ...props,
            childDict: {},
            stateDict: {},
            paramDict: {}
        });
    }

    accessCard(chunk: Model.Chunk<CardModel>) {
        const target = this.appendChild(chunk);
        if (target) {
            this.eventDict.onCardAccess(target);
            return target;
        }
    }

    @Validator.useCondition(model => !model.childList.length)
    removeCard(target?: CardModel) {
        if (!target) target = this.childList[0];
        const chunk = this.removeChild(target);
        if (chunk) {
            this.eventDict.onCardRemove(target);
            return chunk;
        }
    }
}