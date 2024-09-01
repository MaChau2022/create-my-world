import type { App } from "../app";
import { ConnectorType } from "../type/connector";
import { Connector } from "./connector";
import type { Emitter } from "./emitter";

/** 事件接收器 */
export class Handler<
    E = any, 
    P = any
> extends Connector<Emitter<E>, P> {
    public handleEvent: ConnectorType.Caller<E>;

    constructor(
        caller: ConnectorType.Caller<E>,
        config: ConnectorType.Config,
        parent: P,
        app: App
    ) {
        super(
            config.id || app.referService.getUniqId(),
            parent, 
            app
        );
        app.referService.handlerReferManager.addRefer(this);
        this.handleEvent = caller;
        config.idList?.forEach(id => {
            const emitter = app.referService.emitterReferManager.referDict[id];
            if (emitter) {
                console.log('hit emitter', emitter);
                emitter.bindHandler(this);
            }
        });
    }

    public destroy() { 
        this.connectorList.forEach(item => {
            item.unbindHandler(this);
        }); 
        this.app.referService.handlerReferManager.removeRefer(this);
    }
}
