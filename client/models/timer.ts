import { SpecModel } from ".";
import { ModelCode } from "../services/factory";
import { ModelType } from "../type/model";
import { SpecModelTmpl } from "../type/model-def";

export type TimerModelTmpl = SpecModelTmpl<{
    code: ModelCode.Timer,
    labileInfo: {
        time: number,
    },
    signalDict: {
        timeUpdateBefore: void,
        timeUpdateDone: void,
    }
}>

export class TimerModel extends SpecModel<TimerModelTmpl> {
    protected _effectDict = {};

    constructor(config: ModelType.Config<TimerModelTmpl>) {
        super({
            ...config,
            childDict: {},
            stableInfo: {},
            labileInfo: {
                time: config.labileInfo?.time || 0
            }
        });
        this.testcaseDict = {
            updateTime: this._updateTime.bind(this, 1)
        };
    }
    
    /** 更新时间 */
    private readonly _updateTime = (offsetTime: number) => {
        this._signalDict.timeUpdateBefore.emitEvent();
        this._labileInfo.time += offsetTime;
        this._signalDict.timeUpdateDone.emitEvent();
    };
}
