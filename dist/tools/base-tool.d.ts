/**
 * 智游伴侣 - 基础工具类
 */
import type { ToolConfig, ToolParameter, Result } from '../types/index.js';
export declare abstract class BaseTool {
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly parameters: ToolParameter[];
    get config(): ToolConfig;
    abstract execute(params: Record<string, unknown>): Promise<Result<unknown>>;
    protected validateParams(params: Record<string, unknown>): Result<Record<string, unknown>>;
}
//# sourceMappingURL=base-tool.d.ts.map