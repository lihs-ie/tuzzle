import type { HttpRequest } from '../message/request.js';

/**
 * BaseError - Base error type (without request property)
 * Used for errors not related to HTTP requests, such as TuzzleError
 */
export type BaseError<
  T extends string = string,
  U extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> = Readonly<{
  type: T;
  message: string;
  cause?: Error;
  stack?: string;
}> &
  U;

/**
 * BaseRequestError - Base error type with HTTP request property
 * Most tuzzle errors use this type
 */
export type BaseRequestError<
  T extends string = string,
  U extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> = BaseError<T> &
  Readonly<{
    request: HttpRequest;
  }> &
  U;

/**
 * Type guard generator for errors
 *
 * @param type
 * @param additionalValidation
 * @returns (value: unknown) => value is E
 */
export const isError = <E extends BaseError>(
  type: string,
  additionalValidation?: (candidate: Record<string, unknown>) => boolean,
): ((value: unknown) => value is E) => {
  return (value: unknown): value is E => {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    if (!Object.prototype.hasOwnProperty.call(value, 'type')) {
      return false;
    }

    const candidate = value as Record<string, unknown>;

    if (candidate.type !== type) {
      return false;
    }

    if (typeof candidate.message !== 'string') {
      return false;
    }

    if (typeof candidate.cause !== 'undefined' && !(candidate.cause instanceof Error)) {
      return false;
    }

    if (typeof candidate.stack !== 'undefined' && typeof candidate.stack !== 'string') {
      return false;
    }

    if (additionalValidation && !additionalValidation(candidate)) {
      return false;
    }

    return true;
  };
};

/**
 * Type guard generator for errors with HTTP request
 *
 * @param type - Error type string
 * @param additionalValidation - Additional validation function (optional)
 * @returns Type guard function
 */
export const isRequestError = <E extends BaseRequestError>(
  type: string,
  additionalValidation?: (candidate: Record<string, unknown>) => boolean,
): ((value: unknown) => value is E) => {
  return isError<E>(type, (candidate) => {
    // Validate request field
    if (typeof candidate.request !== 'object' || candidate.request === null) {
      return false;
    }

    // Additional validation
    if (additionalValidation && !additionalValidation(candidate)) {
      return false;
    }

    return true;
  });
};

/**
 * Throws a BaseError as a JavaScript Error
 *
 * @param error
 *
 * @throws JavaScript Error (with BaseError in cause)
 *
 * @example
 * ```typescript
 * type SomeError = BaseError<'SomeError'>;
 * const error: SomeError = {
 *   type: 'SomeError',
 *   message: 'An error occurred',
 * };
 * throwError(error);
 * ```
 */
export const throwError = <E extends BaseError>(error: E): never => {
  const jsError = new Error(error.message, { cause: error });

  if (error.stack) {
    jsError.stack = error.stack;
  }

  throw jsError;
};
