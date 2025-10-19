/**
 * ClientError - Client error type
 * Represents error responses with 4xx HTTP status codes
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';
import { isRequestError as isRequestErrorGuard, type BaseRequestError } from './common.js';

/**
 * ClientError type definition
 * Inherits the structure of BadResponseError and represents 4xx errors
 */
export type ClientError = BaseRequestError<'ClientError'> & {
  readonly response: HttpResponse;
};

/**
 * Creates a ClientError
 *
 * @param message - Error message
 * @param request - HTTP request
 * @param response - HTTP response (with 4xx status code)
 * @param options - Options (cause, stack)
 * @returns ClientError object
 *
 * @example
 * ```typescript
 * const error = createClientError('Not found', request, response);
 * ```
 */
export const createClientError = (
  message: string,
  request: HttpRequest,
  response: HttpResponse,
  options?: { cause?: Error; stack?: string },
): ClientError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'ClientError',
    message,
    request,
    response,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is a ClientError
 *
 * @param value - Value to check
 * @returns true if the value is a ClientError
 *
 * @example
 * ```typescript
 * if (isClientError(error)) {
 *   console.log('Client error:', error.response.statusCode);
 * }
 * ```
 */
export const isClientError = isRequestErrorGuard<ClientError>('ClientError', (candidate) => {
  if (typeof candidate.response !== 'object' || candidate.response === null) {
    return false;
  }

  return true;
});

/**
 * Throws a ClientError as a JavaScript Error
 *
 * @param error - ClientError object
 * @throws JavaScript Error (with ClientError in cause)
 *
 * @example
 * ```typescript
 * const clientError = createClientError('Not found', request, response);
 * throwClientError(clientError);
 * ```
 */
export const throwClientError = (error: ClientError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * Extracts a ClientError from a JavaScript Error
 *
 * @param error - JavaScript Error
 * @returns Extracted ClientError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwClientError(createClientError('Error', request, response));
 * } catch (error) {
 *   const clientError = extractClientError(error as Error);
 *   if (clientError) {
 *     console.log(clientError.response.statusCode);
 *   }
 * }
 * ```
 */
export const extractClientError = (error: unknown): ClientError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isClientError(error.cause)) {
    return error.cause;
  }

  return null;
};
