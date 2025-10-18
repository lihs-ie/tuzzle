/**
 * ServerError - サーバーエラー型
 * 5xx HTTPステータスコードのエラーレスポンスを表現します
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';

/**
 * ServerError 型定義
 * BadResponseError の構造を継承しつつ、5xx エラーを表現します
 */
export type ServerError = {
  readonly type: 'ServerError';
  readonly message: string;
  readonly request: HttpRequest;
  readonly response: HttpResponse;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * ServerError を作成する
 *
 * @param message - エラーメッセージ
 * @param request - HTTPリクエスト
 * @param response - HTTPレスポンス（5xx ステータスコード）
 * @param options - オプション（cause, stack）
 * @returns ServerError オブジェクト
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
 * 値が ServerError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns ServerError の場合は true
 *
 * @example
 * ```typescript
 * if (isServerError(error)) {
 *   console.log('Server error:', error.response.statusCode);
 * }
 * ```
 */
export const isServerError = (value: unknown): value is ServerError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'ServerError' &&
    typeof obj.message === 'string' &&
    typeof obj.request === 'object' &&
    obj.request !== null &&
    typeof obj.response === 'object' &&
    obj.response !== null
  );
};

/**
 * ServerError を JavaScript の Error として throw する
 *
 * @param error - ServerError オブジェクト
 * @throws JavaScript Error（cause に ServerError を含む）
 *
 * @example
 * ```typescript
 * const serverError = createServerError('Internal server error', request, response);
 * throwServerError(serverError);
 * ```
 */
export const throwServerError = (error: ServerError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * JavaScript Error から ServerError を抽出する
 *
 * @param error - JavaScript Error
 * @returns 抽出された ServerError、見つからない場合は null
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
