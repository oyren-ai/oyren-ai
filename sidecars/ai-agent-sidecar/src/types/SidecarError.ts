type SidecarErrorType =
  | "unknown-error"
  | "feature-not-supported"
  | "invalid-input"
  | "api-error";

interface SidecarErrorData {
  shortMessage?: string;
  message?: string;
}

export class SidecarError {
  readonly errorType: SidecarErrorType;
  readonly shortMessage?: string;
  readonly message?: string;

  private constructor(errorType: SidecarErrorType, data?: SidecarErrorData) {
    this.errorType = errorType;
    this.shortMessage = data?.shortMessage;
    this.message = data?.message;
  }

  static UnknownError(data?: SidecarErrorData): SidecarError {
    return new SidecarError("unknown-error", data);
  }

  static ApiError(data?: SidecarErrorData): SidecarError {
    return new SidecarError("api-error", data);
  }

  static FeatureNotSupported(data?: SidecarErrorData): SidecarError {
    return new SidecarError("feature-not-supported", data);
  }

  static InvalidInput(data?: SidecarErrorData): SidecarError {
    return new SidecarError("invalid-input", data);
  }

  isApiError(): boolean {
    return this.errorType === "api-error";
  }

  isUnknownError(): boolean {
    return this.errorType === "unknown-error";
  }

  isFeatureNotSupported(): boolean {
    return this.errorType === "feature-not-supported";
  }

  isInvalidInput(): boolean {
    return this.errorType === "invalid-input";
  }
}
