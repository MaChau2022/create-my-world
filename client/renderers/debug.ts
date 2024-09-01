import type { App } from "../app";
import { Model } from "../models";
import { IBase } from "../type";
import { EventType } from "../type/event";
import { Renderer } from ".";
import { BaseModelDef } from "../type/definition";

export class DebugRenderer<
    M extends BaseModelDef = BaseModelDef
> extends Renderer<{
    stateUpdateDone: EventType.StateUpdateDone<M>
    childUpdateDone: EventType.ChildUpdateDone<M>
}> {
    private readonly $setState: IBase.Func;
    private readonly $setChildren: IBase.Func;

    constructor(
        setState: IBase.Func,
        setChildren: IBase.Func,
        app: App
    ) {
        super(
            {
                stateUpdateDone: (e) => this.handleStateUpdateDone(e),
                childUpdateDone: (e) => this.handleChildUpdateDone(e)
            },
            app
        );
        this.$setState = setState;
        this.$setChildren = setChildren;
    }

    private handleStateUpdateDone(event: EventType.StateUpdateDone<M>) {
        this.$setState(event.state);
    }

    private handleChildUpdateDone(event: EventType.ChildUpdateDone<M>) {
        this.$setChildren(event.children);
    }

    public active(target: Model<M>) {
        target.emitterDict.stateUpdateDone.bindHandler(
            this.$handlerProxy.handlerDict.stateUpdateDone
        );
        target.emitterDict.childUpdateDone.bindHandler(
            this.$handlerProxy.handlerDict.childUpdateDone
        );
    }
}