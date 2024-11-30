import { Model } from "@/model";
import { ChildOf, StateOf } from "./model";

export type Handler<D> = (target: Model, data: D) => D | void; 
export type Emitter<D> = (data: D) => D | void;

export type OnModelAlter<M extends Model> = {
    target: M;
    prev: Readonly<StateOf<M>>;
    next: Readonly<StateOf<M>>;
}
export type OnModelSpawn<M extends Model> = {
    target: M;
    next: Readonly<ChildOf<M>>;
}
export type OnModelCheck<M extends Model> = {
    target: M;
    prev: Readonly<StateOf<M>>;
    next: Readonly<StateOf<M>>;
}

