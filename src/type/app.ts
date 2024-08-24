export type MetaData = {
    config: PerferenceData,
    version: string;
    slots: SlotData[];
}
export type SlotData = {
    id: string;
    name: string;
}
export type PerferenceData = {
    fullscreen: boolean;
    mute: boolean;
}