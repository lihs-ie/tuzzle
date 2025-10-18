/**
 * ClientError - クライアントエラー型
 * 4xx HTTPステータスコードのエラーレスポンスを表現します
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';

/**
 * ClientError 型定義
 * BadResponseError の構造を継承しつつ、4xx エラーを表現します
 */
export type ClientError = {
  readonly type: 'ClientError';
  readonly message: string;
  readonly request: HttpRequest;
  readonly response: HttpResponse;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * ClientError を作成する
 *
 * @param message - エラーメッセージ
 * @param request - HTTPリクエスト
 * @param response - HTTPレスポンス（4xx ステータスコード）
 * @param options - オプション（cause, stack）
 * @returns ClientError オブジェクト
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
 * 値が ClientError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns ClientError の場合は true
 *
 * @example
 * ```typescript
 * if (isClientError(error)) {
 *   console.log('Client error:', error.response.statusCode);
 * }
 * ```
 */
export const isClientError = (value: unknown): value is ClientError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'ClientError' &&
    typeof obj.message === 'string' &&
    typeof obj.request === 'object' &&
    obj.request !== null &&
    typeof obj.response === 'object' &&
    obj.response !== null
  );
};

/**
 * ClientError を JavaScript の Error として throw する
 *
 * @param error - ClientError オブジェクト
 * @throws JavaScript Error（cause に ClientError を含む）
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
 * JavaScript Error から ClientError を抽出する
 *
 * @param error - JavaScript Error
 * @returns 抽出された ClientError、見つからない場合は null
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
