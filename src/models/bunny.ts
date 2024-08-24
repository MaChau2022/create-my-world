import { Model } from ".";
import type { App } from "../app";
import { ModelField } from "../type/definition";
import { BunnyModelDefinition } from "../type/common";
import { ModelId } from "../type/register";
import { SpecificModelConfig } from "../type/sequence";

export class BunnyModel extends Model<BunnyModelDefinition> {
    constructor(
        config: SpecificModelConfig<BunnyModelDefinition>,
        parent: BunnyModelDefinition[ModelField.Parent],
        app: App
    ) {
        super({}, {
            ...config,
            stableState: {
                name: 'bunny'
            },
            unstableState: {
                currentAge: 0,
                ...config.unstableState
            },
            childSequenceList: [
                { 
                    id: ModelId.Bunny,
                    preset: {} 
                },
                { 
                    id: ModelId.Bunny, 
                    preset: {} 
                },
                {
                    id: ModelId.Bunny,
                    preset: {}
                }
            ],
            childSequenceDict: {}
        }, parent, app);
    }
}