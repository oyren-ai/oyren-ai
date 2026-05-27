import type { SidecarResponse } from './types/SidecarResponse.ts';
import type { HandlerResponse } from './types/HandlerResponse.ts';

export class SidecarResponseFactory {
  static success<T>(data: T): SidecarResponse {
    return {
      output: JSON.stringify({
        data,
        error: null
      }),
      isError: false,
      exitCode: 0
    };
  }

  static error(errorType: string, message: string, shortMessage?: string): SidecarResponse {
    return {
      output: JSON.stringify({
        data: null,
        error: {
          errorType,
          shortMessage: shortMessage || null,
          message: message || null,
        }
      }),
      isError: true,
      exitCode: 0,
    };
  }

  static match<T>(response: HandlerResponse<T>): SidecarResponse {
    if (response.data) {
      return this.success(response.data);
    } else if (response.error) {
      return {
        output: JSON.stringify({
          data: null,
          error: response.error,
        }),
        isError: true,
        exitCode: 0,
      };
    } else {
      return this.error("unknown-error", "No data or error in response");
    }
  }
}
