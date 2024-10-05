import { FactoryService } from "./services/factory";
import { ReferenceService } from "./services/reference";
import { Generator } from "./configs/generator";
import { ArchieveData, ArchieveService } from "./services/archieve";
import { PerferenceData, PreferenceService } from "./services/perference";
import { RootModel } from "./models/root";
import { RenderService } from "./services/render";
import { META_SAVE_PATH } from "./configs/context";

export enum AppStatus {
    /** 应用未初始化 */
    CREATED,
    /** 应用初始化完成,节点未挂载 */
    UNMOUNTED,
    /** 应用正在挂载节点 */
    MOUNTING,
    /** 应用已挂载节点 */
    MOUNTED,
    /** 应用正在卸载节点 */
    UNMOUNTING,
}
   
export type MetaData = {
    majorVersion: number
    minorVersion: number
    patchVersion: number
    perferenceData: PerferenceData
    archieveDataList: ArchieveData[]
}

export class App {
    public readonly majorVersion: number;
    public readonly minorVersion: number;
    public readonly patchVersion: number;

    public readonly factoryService: FactoryService;
    public readonly referenceService: ReferenceService;
    public readonly perferenceService: PreferenceService;
    public readonly archieveService: ArchieveService;
    public readonly renderService: RenderService;

    private _root?: RootModel;
    private _status: AppStatus;
    
    public get status() { return this._status; }
    public get root(): RootModel { 
        if (!this._root) throw new Error();
        return this._root;
    }

    constructor() {
        window._app = this;
        
        this.majorVersion = 0;
        this.minorVersion = 1;
        this.patchVersion = 0;

        this.factoryService = new FactoryService(this);
        this.referenceService = new ReferenceService(this);
        this.perferenceService = new PreferenceService(this);
        this.archieveService = new ArchieveService(this);
        this.renderService = new RenderService(this);

        this._status = AppStatus.CREATED;
    }

    public async initialize() {
        const metadata = await this._loadMetaData();
        this.archieveService.initialize(metadata.archieveDataList);
        this.perferenceService.initialize(metadata.perferenceData);
        this.renderService.initialize();
        this._status = AppStatus.UNMOUNTED;
    }

    public async startGame(index?: number) {
        this._status = AppStatus.MOUNTING;
        const config = index === undefined ?
            await this.archieveService.createArchieve() :
            await this.archieveService.loadArchieve(index);
        this._root = this.factoryService.unserialize({
            ...config,
            parent: this,
            app: this  
        });
        this._status = AppStatus.MOUNTED;
    }

    public async quitGame() {
        this._status = AppStatus.UNMOUNTING;
        this.archieveService.saveArchieve();
        this.referenceService.reset();
        this._root = undefined;
        this._status = AppStatus.UNMOUNTED;
    }

    public async saveMetaData() {
        const save: MetaData = {
            majorVersion: this.majorVersion,
            minorVersion: this.minorVersion,
            patchVersion: this.patchVersion,
            perferenceData: this.perferenceService.data,
            archieveDataList: this.archieveService.data
        };
        await localStorage.setItem(META_SAVE_PATH, JSON.stringify(save));
    } 
    
    private async _loadMetaData(): Promise<MetaData> {
        const raw = await localStorage.getItem(META_SAVE_PATH);
        if (!raw) return Generator.appMetaData();
        const result = JSON.parse(raw) as MetaData;
        return result;
    }
}