import type { App } from "../app";
import { ModelDefinition, ModelField  } from "../type/definition";
import { ModelConfig, ModelReflect, ModelSequence } from "../type/sequence";
import { Emitter } from "../utils/emitter";
import { Handler } from "../utils/handler";
import { Delegator } from "../utils/delegator";
import { Updater } from "../utils/updater";
import { Base, Reflect } from "../type/base";
import { Event } from "../type/event";
import { PureModelEmitIntf } from "../type/common";

export class Model<
    M extends ModelDefinition = ModelDefinition
> {
    public readonly id: ModelField.Id<M>;
    public readonly app: App;
    public readonly key: string;
    public readonly parent: M[ModelField.Parent];

    private readonly $preset: ModelField.Preset<M>;
    private readonly $stableState: M[ModelField.StableState];
    private readonly $unstableState: M[ModelField.UnstableState];
    private readonly $state: ModelReflect.State<M>;
    public get state() { return { ...this.$state }; }
    
    private readonly $updaterDict: {
        [K in keyof ModelReflect.State<M>]: Updater<M, K>
    };
    public readonly updaterBindIntf: {
        [K in keyof ModelReflect.State<M>]: 
            (target: Handler<Event.Of<
                Event.StateUpdateBefore<M, K>
            >>) => void
    };

    private readonly $childDict: M[ModelField.ChildDict];
    private readonly $childList: M[ModelField.ChildList];

    public get childDict() { return { ...this.$childDict }; }
    public get childList() { return [ ...this.$childList ]; }
    public get children() {
        return this.$childList.concat(
            Object.values(this.$childDict)
        );
    }

    private readonly $emitterDict: { 
        [K in keyof ModelReflect.EmitIntf<M>]: 
            Emitter<ModelReflect.EmitIntf<M>[K]>
    };
    private readonly $pureEmitterDict: {
        [K in keyof PureModelEmitIntf<M>]:
            Emitter<PureModelEmitIntf<M>[K]>
    };
    public readonly emitterBindIntf: {
        [K in keyof ModelReflect.EmitIntf<M>]:
            (target: Handler<
                ModelReflect.EmitIntf<M>[K]
            >) => void
    };

    
    private readonly $handlerDict: {
        [K in keyof M[ModelField.HandleIntf]]:
            Handler<M[ModelField.HandleIntf][K]>
    };

    public readonly debugIntf: Record<string, Base.Function>;

    constructor(
        handleEventDict: M[ModelField.HandleIntf],
        config: ModelConfig<M>,
        parent: M[ModelField.Parent],
        app: App
    ) {
        this.app = app;
        this.id = config.id;
        this.key = config.key || '';
        this.parent = parent;

        this.$preset = config.preset || {};
        this.$stableState = config.stableState;
        this.$unstableState = 
            Delegator.initUnstableState(
                config.unstableState,
                this
            );
        this.$state = {
            ...this.$stableState,
            ...this.$unstableState
        };
        this.$updaterDict = 
            Delegator.initUpdaterDict(
                config.updaterSequenceDict || {},
                this,
                app
            );
        this.updaterBindIntf = Delegator.initBindIntf<
            { [K in keyof ModelReflect.State<M>]: 
                Event.Of<Event.StateUpdateBefore<M, K>>}
        >(this.$updaterDict);
        
        this.$childList = config.childSequenceList?.map(item => {
            return app.factoryService.unserialize(item, this);
        }) || [];
        this.$childDict = 
            Delegator.initChildDict(
                config.childSequenceDict,
                this,
                app
            );
        
        this.$pureEmitterDict = 
        this.$emitterDict = 
            Delegator.initEmitterDict(
                config.emitterSequenceDict || {},
                this,
                app
            );
        this.emitterBindIntf = Delegator.initBindIntf(this.$emitterDict);
        
        this.$handlerDict = 
            Delegator.initHandlerDict(
                handleEventDict,
                config.handlerSequenceDict || {},
                parent,
                app
            );

        this.debugIntf = {};
    }

    
    public addChild(
        target: Reflect.Iterator<M[ModelField.ChildList]>
    ) {
        this.$childList.push(target);
        this.$pureEmitterDict.childUpdateDone.emit({
            target: this,
            children: this.children
        });
    }

    public removeChild(
        target: Model
    ) {
        const index = this.$childList.indexOf(target);
        if (index >= 0) {
            this.$childList.splice(index, 1); 
            this.$pureEmitterDict.childUpdateDone.emit({
                target: this,
                children: this.children
            });
            return;
        }
        Object.keys(this.$childDict).forEach(key => {
            if (this.$childDict[key] === target) {
                delete this.$childDict[key];
                this.$pureEmitterDict.childUpdateDone.emit({
                    target: this,
                    children: this.children
                });
                return;
            }
        });
        throw new Error();
    }

    public destroy() {
        this.$childList.forEach(item => {
            item.destroy();
        });
        Object.values(this.$childDict).forEach(item => {
            item.destroy();
        });
        Object.values({
            ...this.$emitterDict,
            ...this.$handlerDict,
            ...this.$updaterDict
        }).forEach(item => {
            item.destroy();
        });
        if (this.parent) {
            this.parent.removeChild(this as Model);
        }
    }

    public updateState<
        K extends keyof ModelReflect.State<M>
    >(key: K) {
        const prev = this.$state[key];
        const current = this.$stableState[key] || this.$unstableState[key];
        const event = {
            target: this,
            prev: current,
            next: current
        };
        this.$updaterDict[key].emit(event);
        const next = event.next;
        if (prev !== next) {
            this.$state[key] = next;
            this.$pureEmitterDict.stateUpdateDone.emit({
                target: this,
                state: this.state
            });
            // const a: Model<SpecificModelDefinition<{
            //     [ModelField.Id]: 3,
            //     [ModelField.EmitterDict]: {
            //         foo: (event: number) => void,
            //         bar: (Event: {
            //             x: string,
            //             y: number
            //         }) => void,
            //         stateUpdateDone: (event: number) => void
            //     }
            // }>> = undefined as any;
            // a.$emitterDict.bar.emitEvent({
            //     x: 'aa',
            //     y: 3
            // });
            // a.$emitterDict.stateUpdateDone.emitEvent({
            //     target: a,
            //     state: a.state
            // });
        }
    }

    public serializeEntity(
        entityDict: Record<string,
            Emitter |
            Handler
        >
    ) {
        return Object
            .keys(entityDict)
            .reduce((dict, key) => ({
                ...dict,
                [key]: entityDict[key].serialize()   
            }), {});
    }

    public serialize(): ModelSequence<M> {
        return {
            id: this.id,
            key: this.key,
            preset: this.$preset,
            unstableState: this.$unstableState,
            childSequenceList: this.$childList.map(item => {
                return item.serialize() as any;
            }),
            childSequenceDict: Object
                .keys(this.$childDict)
                .reduce((dict, key) => ({
                    ...dict,
                    [key]: this.$childDict[key].serialize()   
                }), {} as any),
            emitterSequenceDict: 
                this.serializeEntity(this.$emitterDict),
            handlerSequenceDict: 
                this.serializeEntity(this.$handlerDict),
            updaterSequenceDict: 
                this.serializeEntity(this.$updaterDict)
        };
    }
}