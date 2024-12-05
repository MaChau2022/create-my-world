import { Factory } from "@/service/factory";
import { IModel, Model } from "@/model";
import { ChunkOf } from "@/type/model";
import { ICard } from "./card";
import { Dict, Value } from "@/type/base";
import { Player } from "./player";


@Factory.useProduct('deck')
export class Deck extends IModel<
    'deck',
    {},
    ICard[],
    {}
> {
    declare parent: Player;

    constructor(
        chunk: ChunkOf<Deck>,
        parent: Player
    ) {
        super({
            child: [],
            ...chunk,
            state: {}
        }, parent);
    }

    append() {
        this._child.push({
            code: 'wisp'
        });
    }

    shift(): ChunkOf<ICard> | undefined {
        const chunk = this._child.shift();
        return chunk;
    }
}
