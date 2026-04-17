/**
 * 智游伴侣 - 核心类型定义
 * 基于OpenClaw架构设计
 */
export function ok(data) {
    return { success: true, data };
}
export function err(error) {
    return { success: false, error };
}
//# sourceMappingURL=index.js.map