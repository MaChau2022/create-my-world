import { App } from "../app";
import { PerferenceData } from "../type/app";
import { singleton } from "../utils/singleton";

@singleton
export class PerferenceService {
    public readonly app: App;
    private $data!: PerferenceData;
    public get data() { return { ...this.$data }; } 

    constructor(app: App) {
        this.app = app;
    }

    public init(config: PerferenceData) {
        this.$data = config;
    }

    public async update(data: PerferenceData) {
        this.$data = data;
        await this.app.serialize();
        return;
    }
}
