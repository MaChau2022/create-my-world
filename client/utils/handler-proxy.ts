import type { App } from "../app";
import { IBase } from "../type";
import { IConnector } from "../type/connector";
import { Entity } from "./entity";
import { Handler } from "./handler";

/** 接收器代理 */
export class HandlerProxy<
    D extends IBase.Dict, 
    P = any
> extends Entity {
    public readonly parent: P;

    /** 事件触发器集合 */
    private readonly $handlerDict: IConnector.HandlerDict<D, P>;
    public readonly handlerDict = {} as IConnector.HandlerDict<D, P>;

    constructor(
        loader: IConnector.CallerDict<D>,
        config: IConnector.ConfigDict<D> | undefined,
        parent: P,
        app: App
    ) {
        super(app);
        this.parent = parent;
        /** 事件触发器集合 */
        this.$handlerDict = {} as IConnector.HandlerDict<D, P>;
        for (const key in loader) {
            this.$handlerDict[key] = new Handler(
                loader[key].bind(parent), 
                config?.[key] || {}, 
                parent,
                app
            );  
        }
        this.handlerDict = new Proxy(
            this.$handlerDict, { set: () => false }
        );
    }

    public serialize(): IConnector.ChunkDict<D> {
        const result = {} as IConnector.ChunkDict<D>;
        for (const key in this.handlerDict) {
            result[key] = this.handlerDict[key].serialize();
        }
        return result;
    }

    public destroy() {
        Object.values(this.handlerDict).forEach(item => {
            item.destroy();
        });
    }
}
