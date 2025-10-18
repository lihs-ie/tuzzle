/**
 * TransferError - 転送エラー型
 * ネットワーク転送時のエラーを表現します
 */

import type { HttpRequest } from '../message/request.js';

/**
 * TransferError 型定義
 * TuzzleError の構造を継承しつつ、HttpRequest を含みます
 */
export type TransferError = {
  readonly type: 'TransferError';
  readonly message: string;
  readonly request: HttpRequest;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * TransferError を作成する
 *
 * @param message - エラーメッセージ
 * @param request - HTTPリクエスト
 * @param options - オプション（cause, stack）
 * @returns TransferError オブジェクト
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
 * 値が TransferError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns TransferError の場合は true
 *
 * @example
 * ```typescript
 * if (isTransferError(error)) {
 *   console.log(error.request.uri);
 * }
 * ```
 */
export const isTransferError = (value: unknown): value is TransferError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'TransferError' &&
    typeof obj.message === 'string' &&
    typeof obj.request === 'object' &&
    obj.request !== null
  );
};

/**
 * TransferError を JavaScript の Error として throw する
 *
 * @param error - TransferError オブジェクト
 * @throws JavaScript Error（cause に TransferError を含む）
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
 * JavaScript Error から TransferError を抽出する
 *
 * @param error - JavaScript Error
 * @returns 抽出された TransferError、見つからない場合は null
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
