/**
 * TooManyRedirectsError - Too many redirects error type
 * Represents errors when the maximum number of redirects is exceeded
 */

import type { HttpRequest } from '../message/request.js';
import { isRequestError, type BaseRequestError } from './common.js';

/**
 * TooManyRedirectsError type definition
 * Inherits the structure of RequestError and represents too many redirects errors
 */
export type TooManyRedirectsError = BaseRequestError<'TooManyRedirectsError'> & {
  readonly redirectCount: number;
};

/**
 * Creates a TooManyRedirectsError
 *
 * @param message - Error message
 * @param request - HTTP request
 * @param redirectCount - Number of redirects
 * @param options - Options (cause, stack)
 * @returns TooManyRedirectsError object
 *
 * @example
 * ```typescript
 * const error = createTooManyRedirectsError('Too many redirects', request, 10);
 * ```
 */
export const createTooManyRedirectsError = (
  message: string,
  request: HttpRequest,
  redirectCount: number,
  options?: { cause?: Error; stack?: string },
): TooManyRedirectsError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'TooManyRedirectsError',
    message,
    request,
    redirectCount,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is a TooManyRedirectsError
 *
 * @param value - Value to check
 * @returns true if the value is a TooManyRedirectsError
 *
 * @example
 * ```typescript
 * if (isTooManyRedirectsError(error)) {
 *   console.log('Redirect count:', error.redirectCount);
 * }
 * ```
 */
export const isTooManyRedirectsError = isRequestError<TooManyRedirectsError>(
  'TooManyRedirectsError',
  (candidate) => {
    if (typeof candidate.redirectCount !== 'number') {
      return false;
    }

    return true;
  },
);

/**
 * Throws a TooManyRedirectsError as a JavaScript Error
 *
 * @param error - TooManyRedirectsError object
 * @throws JavaScript Error (with TooManyRedirectsError in cause)
 *
 * @example
 * ```typescript
 * const error = createTooManyRedirectsError('Too many redirects', request, 10);
 * throwTooManyRedirectsError(error);
 * ```
 */
export const throwTooManyRedirectsError = (error: TooManyRedirectsError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * Extracts a TooManyRedirectsError from a JavaScript Error
 *
 * @param error - JavaScript Error
 * @returns Extracted TooManyRedirectsError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwTooManyRedirectsError(createTooManyRedirectsError('Error', request, 10));
 * } catch (error) {
 *   const tooManyRedirectsError = extractTooManyRedirectsError(error as Error);
 *   if (tooManyRedirectsError) {
 *     console.log(tooManyRedirectsError.redirectCount);
 *   }
 * }
 * ```
 */
export const extractTooManyRedirectsError = (error: unknown): TooManyRedirectsError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isTooManyRedirectsError(error.cause)) {
    return error.cause;
  }

  return null;
};
