import type { App } from "../app";
import { Base } from "../type/base";
import type { Handler } from "./handler";

export class Emitter<
    E extends Base.Function = Base.Function, 
    P = any
> {
    public readonly key: string;
    public readonly app: App;
    public readonly parent: P;
    
    private readonly $handlerList: Array<Handler<E>> = [];
    public get handlerList() { 
        return [ ...this.$handlerList ]; 
    }

    constructor(
        config: string[],
        parent: P,
        app: App
    ) {
        const [ key, ...refer ] = config;
        this.key = 
            key || 
            app.referService.getTicket();
        this.app = app;
        this.parent = parent;
        refer
            .map(key => {
                return app.referService.handlerReferManager.referDict[key];
            })
            .filter(Boolean)
            .forEach(item => {
                this.bind(item as Handler<E>);
            });
    }

    public emit(...event: Parameters<E>) {
        this.$handlerList.forEach(item => {
            item.handle(...event);
        });
    }

    private $addHandler(target: Handler<E>) {
        if (this.$handlerList.includes(target)) {
            throw new Error();
        }
        this.$handlerList.push(target);
    }

    private $removeHandler(target: Handler<E>) {
        const index = this.$handlerList.indexOf(target);
        if (index === -1) {
            throw new Error();
        }
        this.$handlerList.splice(index, 1);
    }
    
    public bind(handler: Handler<E>) {
        this.$addHandler(handler);
        handler.$addEmitter(this);
    }

    public unbind(handler: Handler<E>) {
        this.$removeHandler(handler);
        handler.$removeEmitter(this);
    }

    public destroy() { 
        this.$handlerList.forEach(item => {
            this.unbind(item);
        }); 
    }
    
    public serialize() {
        return this.$handlerList
            .map(item => item.key)
            .concat(this.key);
    }

}
