import { SLOT_PATH } from "../configs/base";
import { AppStatus } from "../types/status";
import { MetaData, SlotData } from "../types/app";
import { appStatus } from "../utils/status";
import { singleton } from "../utils/decors";
import { Service } from "./base";
import { CreateSlotForm } from "../types/forms";
import { Exception } from "../utils/exceptions";
import { RootChunk } from "../types/root";
import { RootModel } from "../models/root";
import { BaseFunction } from "../types/base";

@singleton
export class SlotsService extends Service {
    private _index?: number;

    private _data: SlotData[] = [];
    public get data() { return this._data; } 

    @appStatus(AppStatus.INITED)
    public init(config: SlotData[]) {
        this._data = config;
    }

    private _register(): number {
        let ticket = 1;
        while (this._data.find(item => item.slotId === ticket)) {
            ticket += 1;
        }
        return ticket;
    }
    
    @appStatus(AppStatus.UNMOUNTED)
    public async new(options: CreateSlotForm): Promise<RootChunk> {
        const slotId = this._register();
        const path = `${SLOT_PATH}_${slotId}`;
        const length = this._data.length;
        this._data.push({
            name: options.name,
            slotId: slotId,
            progress: 0
        });
        this.app.refer.reset();
        const root = new RootModel({ rule: options }, this.app);
        const record = root.serialize();
        await localStorage.setItem(path, JSON.stringify(record));
        await this.app.meta.save();
        // await this.app.mount(length);
        return record;
    }

    @appStatus(AppStatus.MOUNTING)
    public async load(index: number): Promise<RootChunk> {
        this._index = index;
        const slot = this._data[index];
        const path = `${SLOT_PATH}_${slot.slotId}`;
        const raw = await localStorage.getItem(path);
        if (!raw) throw new Exception();
        return JSON.parse(raw) as RootChunk;
    }

    @appStatus(AppStatus.UNMOUNTED)
    public async delete(index: number) {
        const slot = this._data[index];
        const path = `${SLOT_PATH}_${slot.slotId}`;
        this._data.splice(index, 1);
        await this.app.meta.save();
        await localStorage.removeItem(path);
    }

    @appStatus(AppStatus.MOUNTED)
    public async quit() {
        this._index = undefined;
    }

    @appStatus(AppStatus.MOUNTED)
    public async save() {
        const index = this._index;
        const root = this.app.root;
        if (!root || index === undefined) {
            throw new Exception();
        }
        const slot = this._data[index];
        const path = `${SLOT_PATH}_${slot.slotId}`;
        const record = root.serialize();
        this._data[index] = {
            ...slot,
            progress: root.data.progress
        };
        await localStorage.setItem(path, JSON.stringify(record));
        await this.app.meta.save();
    }
}