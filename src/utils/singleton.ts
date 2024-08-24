import { Base } from "../type/base";

const $ref = new Set<Base.Class>();

export function singleton(IConstructor: Base.Class) {
    return class extends IConstructor {
        constructor(...config: any[]) {
            if ($ref.has(IConstructor)) {
                throw new Error();
            }
            $ref.add(IConstructor);
            super(...config);
        }
    } as any;
}
