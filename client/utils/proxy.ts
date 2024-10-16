import { Base, KeyOf, ValueOf } from "../types";


export namespace Proxy {
    export function automicDict<T extends Base.Dict>(
        getter: (key: KeyOf<T>) => T[KeyOf<T>]
    ): T {
        return new global.Proxy({} as T, {
            get: (origin, key: KeyOf<T>) => {
                if (!origin[key]) origin[key] = getter(key);
                return origin[key];
            },
            set: () => false,
            deleteProperty: () => false
        });
    }

    export function readonlyDict<T extends Base.Dict>(origin: T): T {
        return new global.Proxy(origin, {
            set: () => false,
            deleteProperty: () => false
        });
    }

    export function controlledDict<T extends Base.Dict>(
        origin: T,
        setter: (key: KeyOf<T>, value: ValueOf<T>) => void,
        remover: (key: KeyOf<T>, value: ValueOf<T>) => void
    ) {
        return new global.Proxy(origin, {
            set: (origin, key: KeyOf<T>, value: ValueOf<T>) => {
                origin[key] = value;
                setter(key, value);
                return true;
            },
            deleteProperty: (origin, key: KeyOf<T>) => {
                const value = origin[key];  
                delete origin[key];
                remover(key, value);
                return true;
            }
        });
    }

    export function controlledList<T extends Base.List>(
        origin: T,
        setter: (value: T[number]) => void,
        remover: (value: T[number]) => void
    ) {
        let _isDelegated = false;

        origin.splice = (index, removeCount = 1, ...setList) => {
            _isDelegated = true;
            const removeList = origin.slice(index, index + removeCount);
            const result = Array.prototype.splice.call(
                origin, 
                index,
                removeCount,
                ...setList
            );
            setList.forEach(setter);
            removeList.forEach(remover);
            _isDelegated = false;
            return result;
        };

        origin.push = (...setList) => {
            _isDelegated = true;
            const result = Array.prototype.push.apply(origin, setList);
            setList.forEach(setter);
            _isDelegated = false;
            return result;
        };
        origin.pop = () => {
            _isDelegated = true;
            const item = origin.pop();
            remover(item);
            _isDelegated = false;
            return item;
        };

        origin.shift = () => {
            _isDelegated = true;
            const item = origin.shift();
            remover(item);
            _isDelegated = false;
            return item;
        };
        origin.unshift = (...setList) => {
            _isDelegated = true;
            const result = Array.prototype.unshift.apply(origin, setList);
            setList.forEach(setter);
            _isDelegated = false;  
            return result;
        };

        return new global.Proxy(origin, {
            set: (origin, key: KeyOf<T>, value: ValueOf<T>) => {
                origin[key] = value;
                if (_isDelegated) return true;
                if (key as any === Symbol.iterator) return true;
                if (isNaN(Number(key))) return true;
                setter(value);
                return true;
            },
            deleteProperty: (origin, key: KeyOf<T>) => {
                const value = origin[key];
                delete origin[key];
                if (_isDelegated) return true;
                if (key as any === Symbol.iterator) return true;
                if (isNaN(Number(key))) return true;
                remover(value);
                return true;
            }
        });
    }
}