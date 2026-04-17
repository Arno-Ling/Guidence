/**
 * 智游伴侣 - 基础工具类
 */
import { ok, err } from '../types/index.js';
export class BaseTool {
    get config() {
        return {
            name: this.name,
            description: this.description,
            parameters: this.parameters
        };
    }
    validateParams(params) {
        const errors = [];
        for (const param of this.parameters) {
            if (param.required && !(param.name in params)) {
                errors.push(`Missing required parameter: ${param.name}`);
            }
            if (param.name in params) {
                const value = params[param.name];
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== param.type) {
                    errors.push(`Parameter ${param.name} should be ${param.type}, got ${actualType}`);
                }
            }
        }
        if (errors.length > 0) {
            return err(new Error(errors.join('; ')));
        }
        return ok(params);
    }
}
//# sourceMappingURL=base-tool.js.map