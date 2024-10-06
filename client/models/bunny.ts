import { SpecModel } from ".";
import { ModelCode } from "../services/factory";
import { ModelConfig } from "../type/model";
import { SpecModelDef } from "../type/model-def";
import { Random } from "../utils/random";

export type BunnyModelDef = SpecModelDef<{
    code: ModelCode.Bunny,
    info: {
        curAge: number,
        maxAge: number,
    },
    reactDict: {
        timeUpdateDone: void
    }
}>

export class BunnyModel extends SpecModel<BunnyModelDef> {
    protected _reactDict = this._initReactDict({
        timeUpdateDone: this.handleTimeUpdateDone
    });

    constructor(config: ModelConfig<BunnyModelDef>) {
        super({
            ...config,
            childDict: {},
            info: {
                curAge: config.info?.curAge || 0,
                maxAge: config.info?.maxAge ||  Random.number(-25, 25) + 100
            }
        });
        this.apiDict = {
            spawnChild: this.spawnChild
        };
    }

    public readonly initialize = () => {
        const timer = this.app.root.childDict.timer;
        this._reactDict.timeUpdateDone.bindEvent(
            timer.eventDict.timeUpdateDone
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