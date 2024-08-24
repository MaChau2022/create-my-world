import type { App } from "../app";
import type { Model } from "../models";
import { Base } from "../type/base";
import { ModelDefinition, ModelField } from "../type/definition";
import { ModelReflect } from "../type/sequence";
import { Emitter } from "./emitter";
import { Handler } from "./handler";
import { Updater } from "./updater";

export namespace Delegator {
    export function initUnstableState<
        M extends ModelDefinition
    >(
        unstableState: M[ModelField.UnstableState],
        target: Model<M>
    ) {
        return new Proxy(unstableState, {
            set: (origin, key, value) => {
                origin[key as keyof M[ModelField.UnstableState]] = value;
                target.updateState(key as keyof M[ModelField.UnstableState]);
                return true;
            }
        });
    }

    export function initChildDict<
        M extends ModelDefinition
    >(
        childSequenceDict: { 
            [K in keyof M[ModelField.ChildDict]]: 
                ModelReflect.Sequence<M[ModelField.ChildDict][K]> 
        },
        target: Model<M>,
        app: App
    ) {
        const origin = Object
            .keys(childSequenceDict)
            .reduce((result, key) => ({
                ...result,
                [key]: app.factoryService.unserialize(
                    childSequenceDict[key],
                    target
                )
            }), {} as M[ModelField.ChildDict]);
        return new Proxy(origin, {
            set: (origin, key, value) => {
                if (origin[key as keyof M[ModelField.ChildDict]]) {
                    throw new Error();
                }
                origin[key as keyof M[ModelField.ChildDict]] = value;
                return true;
            }
        });
    }
    

    export function initEmitterDict<
        E extends Record<string, Base.Function>, 
        P
    >(
        configDict: { [K in keyof E]?: string[] },
        parent: P,
        app: App
    ) {
        const dict = {} as { [K in keyof E]: Emitter<E[K], P> };
        const origin = Object
            .keys(configDict)
            .reduce((result, key) => ({
                ...result,
                [key]: new Emitter<Base.Function, P>(
                    configDict[key] || [],
                    parent,
                    app
                )
            }), dict);
        return new Proxy<
            { [K in keyof E]: Emitter<E[K], P> }
        >(origin, {
            set: () => false,
            get: (target, key) => {
                target[key as keyof E] = 
                    target[key as keyof E] ||
                    new Emitter<any, P>([], parent, app);
                return target[key as keyof E];
            }
        });
    }

    export function initBindIntf<
        E extends Record<string, Base.Function>
    >(emitterDict: {
        [K in keyof E]: Emitter<E[K]>
    }): {
        [K in keyof E]: (Handler: Handler<E[K]>) => void
    } {
        return new Proxy({} as {
            [K in keyof E]: (Handler: Handler<E[K]>) => void
        }, {
            get: (target, key) => {
                return emitterDict[key as keyof E]
                    .bind
                    .bind(emitterDict[key as keyof E]);
            },
            set: () => false
        }); 
    }

    export function initUpdaterDict<
        M extends ModelDefinition
    >(
        configDict: { [K in keyof ModelReflect.State<M>]?: string[] },
        parent: Model<M>,
        app: App
    ) {
        const dict = {} as { 
            [K in keyof ModelReflect.State<M>]: Updater<M, K>
        };
        const origin = Object
            .keys(configDict)
            .reduce((result, key) => ({
                ...result,
                [key]: new Updater(
                    key,
                    configDict[key] || [],
                    parent,
                    app
                )
            }), dict);
        return new Proxy(origin, {
            set: () => false,
            get: (target, key) => {
                target[key as keyof ModelReflect.State<M>] = 
                    target[key as keyof ModelReflect.State<M>] ||
                    new Updater(key as keyof ModelReflect.State<M>, [], parent, app);
                return target[key as keyof ModelReflect.State<M>];
            }
        });
    }

    export function initHandlerDict<
        E extends Record<string, Base.Function>, 
        P
    >(
        handleEventDict: E,
        configDict: { [K in keyof E]?: string[] },
        parent: P,
        app: App
    ) {
        const dict = {} as { [K in keyof E]: Handler<E[K], P> };
        const origin = Object
            .keys(configDict)
            .reduce((result, key) => ({
                ...result,
                [key]: new Handler<Base.Function, P>(
                    handleEventDict[key],
                    configDict[key] || [],
                    parent,
                    app
                )
            }), dict);
        return new Proxy(origin, {
            set: () => false
        });
    }
}