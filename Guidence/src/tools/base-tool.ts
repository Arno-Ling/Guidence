/**
 * 智游伴侣 - 基础工具类
 */

import type { ToolConfig, ToolParameter, Result } from '../types/index.js';
import { ok, err } from '../types/index.js';

export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly parameters: ToolParameter[];

  get config(): ToolConfig {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }

  abstract execute(params: Record<string, unknown>): Promise<Result<unknown>>;

  protected validateParams(params: Record<string, unknown>): Result<Record<string, unknown>> {
    const errors: string[] = [];

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
