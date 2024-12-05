import { Factory } from "@/service/factory";
import { IModel, Model } from "@/model";
import { ChunkOf } from "@/type/model";
import { Player } from "./player";
import { ICard } from "./card";


@Factory.useProduct('tomb')
export class Tomb extends IModel<
    'tomb',
    {},
    ICard[],
    {}
> {
    declare parent: Player;

    constructor(
        chunk: ChunkOf<Tomb>,
        parent: Player
    ) {
        super({
            child: [],
            ...chunk,
            state: {}
        }, parent);
    }
        
    append(chunk: ChunkOf<ICard>) {
        this._child.push(chunk);
    }

}
