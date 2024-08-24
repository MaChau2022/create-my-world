import { META_DATA } from "./configs/meta";
import { PerferenceService } from "./services/config";
import { FactoryService } from "./services/factory";
import { MetaService } from "./services/meta";
import { ReferService } from "./services/refer";
import { AppData } from "./type/app";




export class App {
    public readonly version: string;

    public readonly factoryService: FactoryService;
    public readonly referService: ReferService;
    public readonly configService: PerferenceService;

    constructor() {
        this.version = '1.0.0';
        this.factoryService = new FactoryService(this);
        this.referService = new ReferService(this);
        this.configService = new PerferenceService(this);
    }

    public async getMetaData(): Promise<AppData.Meta> {
        const raw = await localStorage.getItem(META_PATH);
        if (!raw) return META_DATA;
        const result = JSON.parse(raw) as AppData.Meta;
        return result;
    }

    public async serialize() {
        const save: AppData.Meta = {
            version: this.version,
            config: this.configService.data
        };
        await localStorage.setItem(META_PATH, JSON.stringify(save));
    } 
}