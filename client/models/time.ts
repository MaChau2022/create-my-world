import { Model } from ".";
import type { App } from "../app";
import { TimerModelDef } from "../type/definition";
import { ModelType } from "../type/model";
import { ModelKey } from "../type/registry";

export class TimerModel extends Model<TimerModelDef> {
    protected $handlerDict: ModelType.HandlerDict<TimerModelDef> = {};

    constructor(
        config: ModelType.RawConfig<TimerModelDef>,
        parent: TimerModelDef[ModelKey.Parent],
        app: App
    ) {
        super(
            {
                ...config,
                originState: {
                    time: 0,
                    ...config.originState
                },
                childChunkDict: {},
                childChunkList: []
            },
            parent,
            app
        );
        console.log("TimeModel created");
        this.debuggerDict.updateTime = this.updateTime.bind(this, 1);
    }
    
    /** 更新时间 */
    public updateTime(offsetTime: number) {
        this.$emitterDict.tickBefore();
        this.$originState.time += offsetTime;
        this.$emitterDict.tickDone();
    }
}