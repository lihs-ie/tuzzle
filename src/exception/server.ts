/**
 * ServerError - Server error type
 * Represents error responses with 5xx HTTP status codes
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';
import { isRequestError, type BaseRequestError } from './common.js';

/**
 * ServerError type definition
 * Inherits the structure of BadResponseError and represents 5xx errors
 */
export type ServerError = BaseRequestError<'ServerError'> & {
  readonly response: HttpResponse;
};

/**
 * Creates a ServerError
 *
 * @param message - Error message
 * @param request - HTTP request
 * @param response - HTTP response (with 5xx status code)
 * @param options - Options (cause, stack)
 * @returns ServerError object
 *
 * @example
 * ```typescript
 * const error = createServerError('Internal server error', request, response);
 * ```
 */
export const createServerError = (
  message: string,
  request: HttpRequest,
  response: HttpResponse,
  options?: { cause?: Error; stack?: string },
): ServerError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'ServerError',
    message,
    request,
    response,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is a ServerError
 *
 * @param value - Value to check
 * @returns true if the value is a ServerError
 *
 * @example
 * ```typescript
 * if (isServerError(error)) {
 *   console.log('Server error:', error.response.statusCode);
 * }
 * ```
 */
export const isServerError = isRequestError<ServerError>('ServerError', (candidate) => {
  if (typeof candidate.response !== 'object' || candidate.response === null) {
    return false;
  }

  return true;
});

/**
 * Extracts a ServerError from a JavaScript Error
 *
 * @param error - JavaScript Error
 * @returns Extracted ServerError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwServerError(createServerError('Error', request, response));
 * } catch (error) {
 *   const serverError = extractServerError(error as Error);
 *   if (serverError) {
 *     console.log(serverError.response.statusCode);
 *   }
 * }
 * ```
 */
export const extractServerError = (error: unknown): ServerError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isServerError(error.cause)) {
    return error.cause;
  }

  return null;
};
