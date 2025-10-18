/**
 * RequestError - リクエストエラー型
 * HTTPリクエストの送信時に発生したエラーを表現します
 * BadResponseError と TooManyRedirectsError の親となります
 */

import type { HttpRequest } from '../message/request.js';

/**
 * RequestError 型定義
 * TransferError の構造を継承しつつ、リクエストエラーを表現します
 */
export type RequestError = {
  readonly type: 'RequestError';
  readonly message: string;
  readonly request: HttpRequest;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * RequestError を作成する
 *
 * @param message - エラーメッセージ
 * @param request - HTTPリクエスト
 * @param options - オプション（cause, stack）
 * @returns RequestError オブジェクト
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
 * 値が RequestError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns RequestError の場合は true
 *
 * @example
 * ```typescript
 * if (isRequestError(error)) {
 *   console.log('Request failed:', error.request.uri);
 * }
 * ```
 */
export const isRequestError = (value: unknown): value is RequestError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'RequestError' &&
    typeof obj.message === 'string' &&
    typeof obj.request === 'object' &&
    obj.request !== null
  );
};

/**
 * RequestError を JavaScript の Error として throw する
 *
 * @param error - RequestError オブジェクト
 * @throws JavaScript Error（cause に RequestError を含む）
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
 * JavaScript Error から RequestError を抽出する
 *
 * @param error - JavaScript Error
 * @returns 抽出された RequestError、見つからない場合は null
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
