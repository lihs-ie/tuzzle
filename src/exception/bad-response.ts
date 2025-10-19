/**
 * BadResponseError - Bad response error type
 * Represents 4xx/5xx HTTP error responses
 * Parent of ClientError and ServerError
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';
import { isRequestError, type BaseRequestError } from './common.js';

/**
 * BadResponseError type definition
 * Inherits the structure of RequestError and includes HTTP response
 */
export type BadResponseError = BaseRequestError<'BadResponseError'> & {
  readonly response: HttpResponse;
};

/**
 * Creates a BadResponseError
 *
 * @param message - Error message
 * @param request - HTTP request
 * @param response - HTTP response
 * @param options - Options (cause, stack)
 * @returns BadResponseError object
 *
 * @example
 * ```typescript
 * const error = createBadResponseError('HTTP error', request, response);
 * ```
 */
export const createBadResponseError = (
  message: string,
  request: HttpRequest,
  response: HttpResponse,
  options?: { cause?: Error; stack?: string },
): BadResponseError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'BadResponseError',
    message,
    request,
    response,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is a BadResponseError
 *
 * @param value - Value to check
 * @returns true if the value is a BadResponseError
 *
 * @example
 * ```typescript
 * if (isBadResponseError(error)) {
 *   console.log('HTTP error:', error.response.statusCode);
 * }
 * ```
 */
export const isBadResponseError = isRequestError<BadResponseError>(
  'BadResponseError',
  (candidate) => {
    if (typeof candidate.response !== 'object' || candidate.response === null) {
      return false;
    }

    return true;
  },
);

/**
 * Throws a BadResponseError as a JavaScript Error
 *
 * @param error - BadResponseError object
 * @throws JavaScript Error (with BadResponseError in cause)
 *
 * @example
 * ```typescript
 * const badResponseError = createBadResponseError('HTTP error', request, response);
 * throwBadResponseError(badResponseError);
 * ```
 */
export const throwBadResponseError = (error: BadResponseError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * Extracts a BadResponseError from a JavaScript Error
 *
 * @param error - JavaScript Error
 * @returns Extracted BadResponseError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwBadResponseError(createBadResponseError('Error', request, response));
 * } catch (error) {
 *   const badResponseError = extractBadResponseError(error as Error);
 *   if (badResponseError) {
 *     console.log(badResponseError.response.statusCode);
 *   }
 * }
 * ```
 */
export const extractBadResponseError = (error: unknown): BadResponseError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isBadResponseError(error.cause)) {
    return error.cause;
  }

  return null;
};
