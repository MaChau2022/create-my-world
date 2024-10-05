import { SpecModel } from ".";
import { ModelCode } from "../services/factory";
import { ModelType } from "../type/model";
import { SpecModelTmpl } from "../type/model-tmpl";
import { Random } from "../utils/random";

export type BunnyModelTmpl = SpecModelTmpl<{
    code: ModelCode.Bunny,
    info: {
        curAge: number,
        maxAge: number,
    },
    effectDict: {
        timeUpdateDone: void
    }
}>

export class BunnyModel extends SpecModel<BunnyModelTmpl> {
    protected _effectDict = this._initEffectDict({
        timeUpdateDone: this.handleTimeUpdateDone
    });

    constructor(config: ModelType.Config<BunnyModelTmpl>) {
        super({
            ...config,
            childDict: {},
            info: {
                curAge: config.info?.curAge || 0,
                maxAge: config.info?.maxAge ||  Random.number(-25, 25) + 100
            }
        });
        this.testcaseDict = {
            spawnChild: this.spawnChild
        };
    }

    public readonly initialize = () => {
        this.app.root.childDict.timer.eventDict.timeUpdateDone.bindEffect(
            this.effectDict.timeUpdateDone
        );
    };

    // public bootDriver() {
    //     const timer = this.root.childDict.time;
    //     timer.emitterDict.tickDone.bindHandler(
    //         this._handlerDict.tickDone
    //     );
    // }

    // /** 繁殖幼崽 */
    public spawnChild() {
        this.app.root.spawnCreature({
            code: ModelCode.Bunny
        });
    }

    /** 年龄增长 */
    private handleTimeUpdateDone() {
        this._originInfo.curAge += 1;
    }
}