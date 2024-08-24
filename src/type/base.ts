export namespace Base {
    export type Key = string | number | symbol
    export type Value = string | number | boolean | Value[]
    export type Data = Record<string, Value>
    export type Dict = Record<string, any>
    export type VoidDict = Record<string, never>
    export type Function = (...args: any[]) => any 
    export type Class = new (...args: any[]) => any
}

