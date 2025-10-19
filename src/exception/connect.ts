/**
 * ConnectError - Connection error type
 * Represents errors when connection to server fails
 */

import type { HttpRequest } from '../message/request.js';
import { isRequestError, type BaseRequestError } from './common.js';

/**
 * ConnectError type definition
 * Inherits the structure of TransferError and represents connection errors
 */
export type ConnectError = BaseRequestError<'ConnectError'>;

/**
 * Creates a ConnectError
 *
 * @param message - Error message
 * @param request - HTTP request
 * @param options - Options (cause, stack)
 * @returns ConnectError object
 *
 * @example
 * ```typescript
 * const error = createConnectError('Connection refused', request);
 * const errorWithCause = createConnectError('ECONNREFUSED', request, { cause: originalError });
 * ```
 */
export const createConnectError = (
  message: string,
  request: HttpRequest,
  options?: { cause?: Error; stack?: string },
): ConnectError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'ConnectError',
    message,
    request,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is a ConnectError
 *
 * @param value - Value to check
 * @returns true if the value is a ConnectError
 *
 * @example
 * ```typescript
 * if (isConnectError(error)) {
 *   console.log('Connection failed:', error.request.uri);
 * }
 * ```
 */
export const isConnectError = isRequestError<ConnectError>('ConnectError');

/**
 * Throws a ConnectError as a JavaScript Error
 *
 * @param error - ConnectError object
 * @throws JavaScript Error (with ConnectError in cause)
 *
 * @example
 * ```typescript
 * const connectError = createConnectError('Connection refused', request);
 * throwConnectError(connectError);
 * ```
 */
export const throwConnectError = (error: ConnectError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * Extracts a ConnectError from a JavaScript Error
 *
 * @param error - JavaScript Error
 * @returns Extracted ConnectError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwConnectError(createConnectError('Error', request));
 * } catch (error) {
 *   const connectError = extractConnectError(error as Error);
 *   if (connectError) {
 *     console.log(connectError.request.uri);
 *   }
 * }
 * ```
 */
export const extractConnectError = (error: unknown): ConnectError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isConnectError(error.cause)) {
    return error.cause;
  }

  return null;
};
