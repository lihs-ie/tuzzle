/**
 * TransferError - Transfer error type
 * Represents errors during network transfer
 */

import type { HttpRequest } from '../message/request.js';
import { isRequestError, type BaseRequestError } from './common.js';

/**
 * TransferError type definition
 * Inherits the structure of TuzzleError and includes HttpRequest
 */
export type TransferError = BaseRequestError<'TransferError'>;

/**
 * Creates a TransferError
 *
 * @param message - Error message
 * @param request - HTTP request
 * @param options - Options (cause, stack)
 * @returns TransferError object
 *
 * @example
 * ```typescript
 * const error = createTransferError('Network timeout', request);
 * const errorWithCause = createTransferError('Transfer failed', request, { cause: originalError });
 * ```
 */
export const createTransferError = (
  message: string,
  request: HttpRequest,
  options?: { cause?: Error; stack?: string },
): TransferError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'TransferError',
    message,
    request,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is a TransferError
 *
 * @param value - Value to check
 * @returns true if the value is a TransferError
 *
 * @example
 * ```typescript
 * if (isTransferError(error)) {
 *   console.log(error.request.uri);
 * }
 * ```
 */
export const isTransferError = isRequestError<TransferError>('TransferError');

/**
 * Throws a TransferError as a JavaScript Error
 *
 * @param error - TransferError object
 * @throws JavaScript Error (with TransferError in cause)
 *
 * @example
 * ```typescript
 * const transferError = createTransferError('Network error', request);
 * throwTransferError(transferError);
 * ```
 */
export const throwTransferError = (error: TransferError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * Extracts a TransferError from a JavaScript Error
 *
 * @param error - JavaScript Error
 * @returns Extracted TransferError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwTransferError(createTransferError('Error', request));
 * } catch (error) {
 *   const transferError = extractTransferError(error as Error);
 *   if (transferError) {
 *     console.log(transferError.request.uri);
 *   }
 * }
 * ```
 */
export const extractTransferError = (error: unknown): TransferError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isTransferError(error.cause)) {
    return error.cause;
  }

  return null;
};
