import { App } from "../app";
import { Const } from "../configs/const";
import { AppData } from "../type/app";
import { singleton } from "../utils/singleton";

@singleton
export class SlotService {
    constructor(app: App) {
        this.app = app;
    }

    public readonly app: App;
    private $index?: number;
    private $data: AppData.Slot[] = [];

    public get data() { return this.$data; } 

    public init(config: AppData.Slot[]) {
        this.$data = config;
    }

    public async newSlot() {
        const id = Date.now().toString(16);
        const path = `${Const.SLOT_PATH}_${id}`;
        this.$data.push({
            id,
            name: 'hello',
        });
        this.app..reset();
        const record = rootSeq({ app: this.app });
        await localStorage.setItem(path, JSON.stringify(record));
        await this.app.meta.save();
        return record;
    }

    public async readSlot(index: number) {
        this.$index = index;
        const slot = this.$data[index];
        const path = `${SLOT_PATH}_${slot.slotId}`;
        const raw = await localStorage.getItem(path);
        if (!raw) throw new Error();
        return JSON.parse(raw) as SeqOf<RootModel>;
    }

    public async removeSlot(index: number) {
        const slot = this.$data[index];
        const path = `${SLOT_PATH}_${slot.slotId}`;
        this.$data.splice(index, 1);

        await this.app.meta.save();
        await localStorage.removeItem(path);
    }

    public async quit() {
        this.$index = undefined;
    }

    public async saveSlot() {
        const index = this.$index;
        const root = this.app.root;
        if (!root || index === undefined) {
            throw new Error();
        }
        const slot = this.$data[index];
        const path = `${SLOT_PATH}_${slot.slotId}`;
        const record = root.seq();
        this.$data[index] = {
            ...slot,
            progress: root.data.progress
        };
        await localStorage.setItem(path, JSON.stringify(record));
        await this.app.meta.save();
    }
}