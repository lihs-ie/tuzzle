/**
 * TooManyRedirectsError - リダイレクト過多エラー型
 * リダイレクトの最大回数を超えた場合のエラーを表現します
 */

import type { HttpRequest } from '../message/request.js';

/**
 * TooManyRedirectsError 型定義
 * RequestError の構造を継承しつつ、リダイレクト過多エラーを表現します
 */
export type TooManyRedirectsError = {
  readonly type: 'TooManyRedirectsError';
  readonly message: string;
  readonly request: HttpRequest;
  readonly redirectCount: number;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * TooManyRedirectsError を作成する
 *
 * @param message - エラーメッセージ
 * @param request - HTTPリクエスト
 * @param redirectCount - リダイレクト回数
 * @param options - オプション（cause, stack）
 * @returns TooManyRedirectsError オブジェクト
 *
 * @example
 * ```typescript
 * const error = createTooManyRedirectsError('Too many redirects', request, 10);
 * ```
 */
export const createTooManyRedirectsError = (
  message: string,
  request: HttpRequest,
  redirectCount: number,
  options?: { cause?: Error; stack?: string },
): TooManyRedirectsError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'TooManyRedirectsError',
    message,
    request,
    redirectCount,
    cause: options?.cause,
    stack,
  };
};

/**
 * 値が TooManyRedirectsError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns TooManyRedirectsError の場合は true
 *
 * @example
 * ```typescript
 * if (isTooManyRedirectsError(error)) {
 *   console.log('Redirect count:', error.redirectCount);
 * }
 * ```
 */
export const isTooManyRedirectsError = (value: unknown): value is TooManyRedirectsError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'TooManyRedirectsError' &&
    typeof obj.message === 'string' &&
    typeof obj.request === 'object' &&
    obj.request !== null &&
    typeof obj.redirectCount === 'number'
  );
};

/**
 * TooManyRedirectsError を JavaScript の Error として throw する
 *
 * @param error - TooManyRedirectsError オブジェクト
 * @throws JavaScript Error（cause に TooManyRedirectsError を含む）
 *
 * @example
 * ```typescript
 * const error = createTooManyRedirectsError('Too many redirects', request, 10);
 * throwTooManyRedirectsError(error);
 * ```
 */
export const throwTooManyRedirectsError = (error: TooManyRedirectsError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * JavaScript Error から TooManyRedirectsError を抽出する
 *
 * @param error - JavaScript Error
 * @returns 抽出された TooManyRedirectsError、見つからない場合は null
 *
 * @example
 * ```typescript
 * try {
 *   throwTooManyRedirectsError(createTooManyRedirectsError('Error', request, 10));
 * } catch (error) {
 *   const tooManyRedirectsError = extractTooManyRedirectsError(error as Error);
 *   if (tooManyRedirectsError) {
 *     console.log(tooManyRedirectsError.redirectCount);
 *   }
 * }
 * ```
 */
export const extractTooManyRedirectsError = (error: unknown): TooManyRedirectsError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isTooManyRedirectsError(error.cause)) {
    return error.cause;
  }

  return null;
};
