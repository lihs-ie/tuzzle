/**
 * BadResponseError - 不正なレスポンスエラー型
 * 4xx/5xx HTTP エラーレスポンスを表現します
 * ClientError と ServerError の親となります
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';

/**
 * BadResponseError 型定義
 * RequestError の構造を継承しつつ、HTTPレスポンスを含みます
 */
export type BadResponseError = {
  readonly type: 'BadResponseError';
  readonly message: string;
  readonly request: HttpRequest;
  readonly response: HttpResponse;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * BadResponseError を作成する
 *
 * @param message - エラーメッセージ
 * @param request - HTTPリクエスト
 * @param response - HTTPレスポンス
 * @param options - オプション（cause, stack）
 * @returns BadResponseError オブジェクト
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
 * 値が BadResponseError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns BadResponseError の場合は true
 *
 * @example
 * ```typescript
 * if (isBadResponseError(error)) {
 *   console.log('HTTP error:', error.response.statusCode);
 * }
 * ```
 */
export const isBadResponseError = (value: unknown): value is BadResponseError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'BadResponseError' &&
    typeof obj.message === 'string' &&
    typeof obj.request === 'object' &&
    obj.request !== null &&
    typeof obj.response === 'object' &&
    obj.response !== null
  );
};

/**
 * BadResponseError を JavaScript の Error として throw する
 *
 * @param error - BadResponseError オブジェクト
 * @throws JavaScript Error（cause に BadResponseError を含む）
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
 * JavaScript Error から BadResponseError を抽出する
 *
 * @param error - JavaScript Error
 * @returns 抽出された BadResponseError、見つからない場合は null
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
