/**
 * ミドルウェアヘルパー関数
 * Guzzle の Middleware クラスに相当
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';
import type { Handler, Middleware, RequestOptions } from '../handler/stack';

// HTTPエラーミドルウェア
export { httpErrors } from './http-errors.js';

/**
 * リクエスト送信前に実行されるコールバック関数の型
 */
export type TapBeforeFn = (request: HttpRequest, options: RequestOptions) => void;

/**
 * レスポンス受信後に実行されるコールバック関数の型
 */
export type TapAfterFn = (
  request: HttpRequest,
  options: RequestOptions,
  response: Promise<HttpResponse>,
) => void;

/**
 * リクエストに対してマッピング関数を適用するミドルウェア
 *
 * @param fn - リクエスト変換関数
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const addAuthHeader = mapRequest((request) =>
 *   withHeader(request, 'Authorization', 'Bearer token')
 * );
 * ```
 */
export const mapRequest = (fn: (request: HttpRequest) => HttpRequest): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      const modifiedRequest = fn(request);
      return next(modifiedRequest, options);
    };
  };
};

/**
 * レスポンスに対してマッピング関数を適用するミドルウェア
 *
 * @param fn - レスポンス変換関数
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const logStatusCode = mapResponse((response) => {
 *   console.log('Status:', response.statusCode);
 *   return response;
 * });
 * ```
 */
export const mapResponse = (fn: (response: HttpResponse) => HttpResponse): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      const response = await next(request, options);
      return fn(response);
    };
  };
};

/**
 * リクエスト/レスポンスを監視するミドルウェア
 * リクエスト・レスポンスは変更せず、ロギングなどに使用
 *
 * @param before - リクエスト送信前に実行される関数（省略可）
 * @param after - レスポンス受信後に実行される関数（省略可）
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const logger = tap(
 *   (request) => console.log('Sending:', request.method, request.uri),
 *   (request, options, response) => response.then(r => console.log('Received:', r.statusCode))
 * );
 * ```
 */
export const tap = (before?: TapBeforeFn, after?: TapAfterFn): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      if (before) {
        before(request, options);
      }

      const responsePromise = next(request, options);

      if (after) {
        after(request, options, responsePromise);
      }

      return responsePromise;
    };
  };
};
