/**
 * RequestError - Request error type
 * Represents errors that occur when sending HTTP requests
 * Parent of BadResponseError and TooManyRedirectsError
 */

import type { HttpRequest } from '../message/request.js';
import { isRequestError as isRequestErrorGuard, type BaseRequestError } from './common.js';

/**
 * RequestError type definition
 * Inherits the structure of TransferError and represents request errors
 */
export type RequestError = BaseRequestError<'RequestError'>;

/**
 * Creates a RequestError
 *
 * @param message - Error message
 * @param request - HTTP request
 * @param options - Options (cause, stack)
 * @returns RequestError object
 *
 * @example
 * ```typescript
 * const error = createRequestError('Request failed', request);
 * const errorWithCause = createRequestError('HTTP error', request, { cause: originalError });
 * ```
 */
export const createRequestError = (
  message: string,
  request: HttpRequest,
  options?: { cause?: Error; stack?: string },
): RequestError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'RequestError',
    message,
    request,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is a RequestError
 *
 * @param value - Value to check
 * @returns true if the value is a RequestError
 *
 * @example
 * ```typescript
 * if (isRequestError(error)) {
 *   console.log('Request failed:', error.request.uri);
 * }
 * ```
 */
export const isRequestError = isRequestErrorGuard<RequestError>('RequestError');

/**
 * Throws a RequestError as a JavaScript Error
 *
 * @param error - RequestError object
 * @throws JavaScript Error (with RequestError in cause)
 *
 * @example
 * ```typescript
 * const requestError = createRequestError('Request failed', request);
 * throwRequestError(requestError);
 * ```
 */
export const throwRequestError = (error: RequestError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * Extracts a RequestError from a JavaScript Error
 *
 * @param error - JavaScript Error
 * @returns Extracted RequestError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwRequestError(createRequestError('Error', request));
 * } catch (error) {
 *   const requestError = extractRequestError(error as Error);
 *   if (requestError) {
 *     console.log(requestError.request.uri);
 *   }
 * }
 * ```
 */
export const extractRequestError = (error: unknown): RequestError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isRequestError(error.cause)) {
    return error.cause;
  }

  return null;
};
