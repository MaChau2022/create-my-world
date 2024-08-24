import type { App } from "../app";
import { Handler } from "../utils/handler";
import { Emitter } from "../utils/emitter";
import { Model } from "../models";
import { singleton } from "../utils/singleton";

export const MIN_TICKET = 100000;
export const MAX_TICKET = 999999;

@singleton
export class ReferService {
    public readonly app: App;

    constructor(app: App) {
        this.app = app;
        this.reset();
    }

    private $modelReferManager!: ReferManager<Model>;
    private $handlerReferManager!: ReferManager<Handler>;
    private $emitterReferManager!: ReferManager<Emitter>;
    private $timestamp!: number; 
    private $ticket!: number;

    public get modelReferManager() { return this.$modelReferManager; }
    public get handlerReferManager() { return this.$handlerReferManager; }
    public get emitterReferManager() { return this.$emitterReferManager; }

    public reset() {
        this.$timestamp = Date.now();
        this.$ticket = MIN_TICKET;
        this.$modelReferManager = new ReferManager();
        this.$handlerReferManager = new ReferManager();
        this.$emitterReferManager = new ReferManager();
    }

    public getTicket(): string {
        let now = Date.now();
        const ticket = this.$ticket;
        this.$ticket += 1;
        if (this.$ticket > MAX_TICKET) {
            this.$ticket = MIN_TICKET;
            while (now === this.$timestamp) now = Date.now();
            this.$timestamp = now;
        }
        return ticket.toString(16) + now.toString(16);
    }
}

export class ReferManager<T extends { key: string }> {
    private readonly $referDict: Record<string, T> = {};
    public get referDict() { return { ...this.$referDict }; }

    public addRefer(target: T) {
        this.$referDict[target.key] = target;
    }

    public removeRefer(target: T) {
        delete this.$referDict[target.key];
    }
}


