import type { App } from "../app";
import { ARCHIEVE_SAVE_PATH } from "../configs/context";
import { Generator } from "../configs/generator";
import { RootModelTmpl } from "../models/root";
import { ModelType } from "../type/model";
import { initReadonlyProxy } from "../utils/proxy";
import { singleton } from "../utils/singleton";

export type ArchieveData = {
    id: string
    name: string,
    progress: number
}

@singleton
export class ArchieveService {
    public readonly app: App;

    // 当前打开的档案
    private _index?: number;

    // 档案信息
    private _data: ArchieveData[];
    public data: ArchieveData[]; 

    constructor(app: App) {
        this.app = app;
        this._data = [];
        this.data = [];
    }

    // 初始化档案信息
    public readonly initialize = (data: ArchieveData[]) => {
        this._data = data;
        this.data = initReadonlyProxy(this._data);
    };

    // 创建新的档案
    public readonly createArchieve = async (
    ): Promise<ModelType.PureConfig<RootModelTmpl>> => {
        this.app.referenceService.reset();
        const id = this.app.referenceService.ticket;
        this._data.push({
            id,
            name: 'hello',
            progress: 0
        });
        const record = Generator.rootModelConfig();
        await localStorage.setItem(`${ARCHIEVE_SAVE_PATH}_${id}`, JSON.stringify(record));
        await this.app.saveMetaData();
        return record;
    };

    // 加载档案
    public async loadArchieve(
        index: number
    ): Promise<ModelType.PureConfig<RootModelTmpl>> {
        this._index = index;
        const archieve = this._data[index];
        const path = `${ARCHIEVE_SAVE_PATH}_${archieve.id}`;
        const raw = await localStorage.getItem(path);
        if (!raw) throw new Error();
        return JSON.parse(raw);
    }

    // 移除档案
    public async removeArchieve(index: number) {
        const slot = this._data[index];
        const path = `${ARCHIEVE_SAVE_PATH}_${slot.id}`;
        this._data.splice(index, 1);
        await localStorage.removeItem(path);
        await this.app.saveMetaData();
    }

    // 卸载当前档案
    public async unloadArchieve() {
        this._index = undefined;
    }

    // 更新当前档案
    public async saveArchieve() {
        const index = this._index;
        const rootModel = this.app.root;
        if (!rootModel || index === undefined) {
            throw new Error();
        }
        const slot = this._data[index];
        const path = `${ARCHIEVE_SAVE_PATH}_${slot.id}`;
        const record = rootModel.serialize();
        // 更新档案信息
        this._data[index] = {
            ...slot,
            progress: rootModel.actualInfo.progress
        };
        await localStorage.setItem(path, JSON.stringify(record));
        await this.app.saveMetaData();
    }
}