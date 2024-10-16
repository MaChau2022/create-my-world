export enum AppStatus {
    /** 应用未初始化 */
    CREATED,
    /** 应用初始化完成,节点未挂载 */
    UNMOUNTED,
    /** 应用正在挂载节点 */
    MOUNTING,
    /** 应用已挂载节点 */
    MOUNTED,
    /** 应用正在卸载节点 */
    UNMOUNTING,
}
   