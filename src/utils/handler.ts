import type { App } from "../app";
import { Base } from "../type/base";
import type { Emitter } from "./emitter";

export class Handler<
    E extends Base.Function = Base.Function, 
    P = any
> {

    public readonly key: string;
    public readonly app: App;
    public readonly parent: P;
    public readonly handle: E;
    
    private readonly $emitterList: Array<Emitter<E>> = [];
    public get emitterList() { 
        return [ ...this.$emitterList ]; 
    }

    constructor(
        handle: E,
        config: string[],
        parent: P,
        app: App
    ) {
        this.handle = handle;
        const [ key, ...refer ] = config;
        this.key = key || app.referService.getTicket();
        this.app = app;
        this.parent = parent;
        refer
            .map(key => {
                return app.referService.emitterReferManager.referDict[key];
            })
            .filter(Boolean)
            .forEach(item => {
                item.bind(this);
            });
    }

    public $addEmitter(target: Emitter<E>) {
        if (this.$emitterList.includes(target)) {
            throw new Error();
        }
        this.$emitterList.push(target);
    }

    public $removeEmitter(target: Emitter<E>) {
        const index = this.$emitterList.indexOf(target);
        if (index === -1) {
            throw new Error();
        }
        this.$emitterList.splice(index, 1);
    }

    public destroy() { 
        this.$emitterList.forEach(item => {
            item.unbind(this);
        }); 
    }
    
    public serialize() {
        return this.$emitterList
            .map(item => item.key)
            .concat(this.key);
    }
}