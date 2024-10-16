// 基本类型
export namespace Base {
    export type Key = string | number | symbol
    export type Value = string | number | boolean
    export type Dict = Record<Key, any>
    export type List = Array<any>
    export type Data = Record<Key, Value>
    export type VoidData = Record<never, never>
    export type VoidList = Array<never>
    export type Function = (params: any) => any
    export type Class = new (...args: any) => any
}

// 迭代器
export type ValueOf<M extends Base.Dict> = M extends Array<any> ? M[number] : M[keyof M];
export type KeyOf<M extends Base.Dict> = keyof M & string;

// 重写部分参数
export type Override<
    A extends Base.Dict, 
    B extends Base.Dict
> = Omit<A, KeyOf<B>> & B
