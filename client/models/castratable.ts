import { SpecModelDef } from "../types/model/define";
import { ModelCode } from "../types/model/code";
import { Model } from ".";
import { ModelConfig } from "../types/model/config";
import { BunnyModel, BunnyModelDef } from "./bunny";
import { EventInfo } from "../types/event";
import { Random } from "../utils/random";
import { AnimalFeaturesModel } from "./animal-feature";


/** 可阉割的 */
export type CastratableModelDef = SpecModelDef<{
    code: ModelCode.Castratable,
    info: {
        /** 是否已经阉割 */
        castrated: boolean,
        /** 阉割造成的预期寿命加成 */
        maxAgeBonus: number
    },
    eventDict: {
        /** 被阉割前 */
        castrateBefore: EventInfo.CastrateBefore<BunnyModel>,
        /** 被阉割后 */
        castrateDone: EventInfo.CastrateDone<BunnyModel>
    }
    reactDict: {
        ageUpdateBefore: EventInfo.StateUpdateBefore<BunnyModelDef, number>
    },
    parent: AnimalFeaturesModel
}>

export class CastratableModel extends Model<CastratableModelDef> {

    /** 预期寿命修饰符 */
    private readonly _handleAgeUpdateBefore = (
        event: EventInfo.StateUpdateBefore<BunnyModelDef, number>
    ): EventInfo.StateUpdateBefore<BunnyModelDef, number> => {
        return {
            ...event,
            next: event.next + this.actualInfo.maxAgeBonus
        };
    };

    protected _reactDict = this._initReactDict({
        ageUpdateBefore: this._handleAgeUpdateBefore
    });

    constructor(config: ModelConfig<CastratableModelDef>) {
        super({
            ...config,
            info: {
                castrated: config.info?.castrated || false,
                maxAgeBonus: config.info?.maxAgeBonus || Random.number(0, 25)
            },
            childDict: {}
        });
    }

    protected readonly _activate = () => {
        if (this.actualInfo.castrated) {
            const animal = this.parent?.parent;
            animal.modifyEventDict.maxAge.bindReact(
                this._reactDict.ageUpdateBefore
            );
        }
    };


    /** 执行阉割 */
    public readonly castrate = () => {
        if (this.actualInfo.castrated) return;
        const animal = this.parent?.parent;
        const result = this._eventDict.castrateBefore.emitEvent({
            model: animal
        });
        if (result?.isAborted)  return;
        this._originInfo.castrated = true;
        animal.modifyEventDict.maxAge.bindReact(
            this._reactDict.ageUpdateBefore
        );
        this._eventDict.castrateDone.emitEvent({ model: animal });
    };

}
