import { Model } from ".";
import type { App } from "../app";
import { ModelField } from "../type/definition";
import { KittyModelDefinition } from "../type/common";
import { ModelId } from "../type/register";
import { SpecificModelConfig } from "../type/sequence";

export class KittyModel extends Model<KittyModelDefinition> {
    constructor(
        config: SpecificModelConfig<KittyModelDefinition>,
        parent: KittyModelDefinition[ModelField.Parent],
        app: App
    ) {
        super({}, {
            ...config,
            stableState: {
                name: config.preset.name || 'kitty',
                color: config.preset.color || 'red'
            },
            unstableState: {
                currentAge: 0,
                ...config.unstableState
            },
            childSequenceDict: {
                zag: { 
                    id: ModelId.Kitty, 
                    preset: { 
                        name: 'kitty',
                        color: 'white'
                    } 
                },
                zig: undefined
            },
            childSequenceList: []
        }, parent, app);
    }
}