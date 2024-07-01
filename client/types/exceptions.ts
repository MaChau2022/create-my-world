import { AppStatus, ModelStatus } from "./status";

enum ErrorId {
    UNREACHABLE_CODE = 100000,
    INVALID_APP_STATUS = 100001,
    INVALID_MODEL_STATUS = 100002,
}

type ErrorMap<K extends ErrorId> = {
    [ErrorId.UNREACHABLE_CODE]: {},
    [ErrorId.INVALID_APP_STATUS]: {
        expect: AppStatus[],
        actual: AppStatus[]
    },
    [ErrorId.INVALID_MODEL_STATUS]: {
        expect: ModelStatus[],
        actual: ModelStatus[],
    }
}[K]

export { ErrorId, ErrorMap };