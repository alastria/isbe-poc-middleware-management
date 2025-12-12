export enum ErrorCode {
  INVALID_NETWORK = 'INVALID_NETWORK',
  NOT_FOUND = 'NOT_FOUND',
  DB_OPERATION_FAILED = 'DB_OPERATION_FAILED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
}

export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: Error | undefined;

  constructor(code: ErrorCode, message: string, originalError?: Error) {
    super(message);
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
