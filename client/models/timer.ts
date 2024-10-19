import { ModelConfig } from "../types/model";
import { TmplModelDef } from "../types/model-def";
import { Model } from ".";
import { useProduct } from "../utils/product";

export type TimerModelDef = TmplModelDef<{
    code: 'timer',
    info: {
        time: number,
    },
    eventDict: {
        tickBefore: void,
        tickDone: void,
    }
}>

@useProduct('timer')
export class TimerModel extends Model<TimerModelDef> {
    protected _reactDict = {};

    constructor(config: ModelConfig<TimerModelDef>) {
        super({
            ...config,
            info: {
                time: config.info?.time || 0
            },
            childDict: {}
        });
    }
    
    /** 更新时间 */
    public readonly tick = (offsetTime: number) => {
        this._eventDict.tickBefore.emitEvent();
        this._originInfo.time += offsetTime;
        this._eventDict.tickDone.emitEvent();
    };
    
    public readonly intf = {};
}
