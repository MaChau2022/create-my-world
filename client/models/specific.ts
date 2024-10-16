// import { Model } from ".";
// import { BaseModelConfig, PureModelConfig } from "../types/model/config";
// import { ModelDef } from "../types/model/define";
// import type { ModelRegstry } from "../types/model/registry";
// import { ModifySafeEventDict, SafeEventDict, UpdateSafeEventDict } from "../utils/event";
// import { initAutomicProxy, initReadonlyProxy } from "../utils/proxy";

// // export type SpecModelDict<M extends ModelDef> = {
// //     [K in KeyOf<ModelDef.ChildDict<M>>]: 
// //         InstanceType<ModelRegstry[ModelDef.Code<ModelDef.ChildDict<M>[K]>]>
// // }
// // export type SpecModelList<M extends ModelDef> = 
// //     Array<InstanceType<ModelRegstry[ModelDef.Code<ValueOf<ModelDef.ChildList<M>>>]>>
    

// export abstract class Model<
//     M extends ModelDef = ModelDef
// > extends Model<M> {
//     public readonly childDict: ModelDef.ChildDict<M>;
//     public readonly childList: ModelDef.ChildList<M>;
//     public readonly eventDict: SafeEventDict<M>;
//     public readonly updateEventDict: UpdateSafeEventDict<M>;
//     public readonly modifyEventDict: ModifySafeEventDict<M>;

//     constructor(config: BaseModelConfig<M>) {
//         super(config);
//         this.childDict = initReadonlyProxy(this._childDict);
//         this.childList = initReadonlyProxy(this._childList);
//         this.eventDict = initAutomicProxy(key => this._eventDict[key].safeEvent);
//         this.updateEventDict = initAutomicProxy(key => this._updateEventDict[key].safeEvent);
//         this.modifyEventDict = initAutomicProxy(key => this._modifyEventDict[key].safeEvent);
//     }

//     protected readonly _unserialize = <
//         C extends ModelDef.Code<M>,
//         M extends ModelDef
//     >(
//         config: PureModelConfig<M> & { code: C }
//     ): InstanceType<ModelRegstry[C]> => {
//         return this.app.factoryService.unserialize({
//             ...config,
//             parent: this,
//             app: this.app
//         }) as InstanceType<ModelRegstry[ModelDef.Code<M>]>;
//     };
// }