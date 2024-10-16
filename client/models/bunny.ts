import { ModelConfig } from "../types/model/config";
import { SpecModelDef } from "../types/model/define";
import { ModelCode } from "../types/model/code";
import { Random } from "../utils/random";
import { AnimalFeaturesModel } from "./animal-feature";
import { Model } from ".";

export type BunnyModelDef = SpecModelDef<{
    code: ModelCode.Bunny,
    info: {
        curAge: number,
        maxAge: number,
        curHappiness: number,
    },
    reactDict: {
        timeUpdateDone: void,
    },
    childDict: {
        features: AnimalFeaturesModel
    }
}>

export class BunnyModel extends Model<BunnyModelDef> {
   
    constructor(config: ModelConfig<BunnyModelDef>) {
        super({
            ...config,
            childDict: {
                features: config.childDict?.features || { code: ModelCode.AnimalFeatures }
            },
            info: {
                curAge: config.info?.curAge || 0,
                maxAge: config.info?.maxAge ||  Random.number(-25, 25) + 100,
                curHappiness: config.info?.curHappiness || 100
            }
        });
    }

    protected readonly _activate = () => {
        const timer = this.app.root.childDict.timer;
        timer.eventDict.tickBefore.bindReact(
            this._reactDict.timeUpdateDone
        );
    };

    /** 繁殖幼崽 */
    public readonly reproduce = () => {
        this.app.root.spawnCreature({
            code: ModelCode.Bunny
        });
    };

    /** 自杀 */
    public readonly suicide = () => {
        this.app.root.killCreature(this);
    };

    /** 年龄增长 */
    private readonly _handleTimeUpdateDone = () => {
        console.log('growing', this.id);
        this._originInfo.curAge += 1;
    };

    protected _reactDict = this._initReactDict({
        timeUpdateDone: this._handleTimeUpdateDone
    });
}