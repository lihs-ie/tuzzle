/**
 * TuzzleError - Base error type for tuzzle
 * Foundation type for all tuzzle errors
 */

import { isError, type BaseError } from './common.js';

/**
 * TuzzleError type definition
 * Object-based error representation (not a class)
 */
export type TuzzleError = BaseError<'TuzzleError'>;

/**
 * Create a TuzzleError
 *
 * @param message - Error message
 * @param options - Options (cause, stack)
 * @returns TuzzleError object
 *
 * @example
 * ```typescript
 * const error = createTuzzleError('Something went wrong');
 * const errorWithCause = createTuzzleError('Failed to fetch', { cause: originalError });
 * ```
 */
export const createTuzzleError = (
  message: string,
  options?: { cause?: Error; stack?: string },
): TuzzleError => {
  // Generate stack trace
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'TuzzleError',
    message,
    cause: options?.cause,
    stack,
  };
};

/**
 * Type guard to check if a value is TuzzleError
 *
 * @param value - Value to check
 * @returns true if the value is TuzzleError
 *
 * @example
 * ```typescript
 * if (isTuzzleError(error)) {
 *   console.log(error.message);
 * }
 * ```
 */
export const isTuzzleError = isError<TuzzleError>('TuzzleError');

/**
 * Throw TuzzleError as a JavaScript Error
 * Conversion function for use with throw/catch syntax
 *
 * @param error - TuzzleError object
 * @throws JavaScript Error (with TuzzleError in cause)
 *
 * @example
 * ```typescript
 * const tuzzleError = createTuzzleError('Something went wrong');
 * throwTuzzleError(tuzzleError);
 * ```
 */
export const throwTuzzleError = (error: TuzzleError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * Extract TuzzleError from JavaScript Error
 * Retrieve original TuzzleError from the cause of a thrown Error
 *
 * @param error - JavaScript Error
 * @returns Extracted TuzzleError, or null if not found
 *
 * @example
 * ```typescript
 * try {
 *   throwTuzzleError(createTuzzleError('Error'));
 * } catch (error) {
 *   const tuzzleError = extractTuzzleError(error as Error);
 *   if (tuzzleError) {
 *     console.log(tuzzleError.message);
 *   }
 * }
 * ```
 */
export const extractTuzzleError = (error: unknown): TuzzleError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isTuzzleError(error.cause)) {
    return error.cause;
  }

  return null;
};
