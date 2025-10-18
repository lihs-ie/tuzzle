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
 *   request.withHeader('Authorization', 'Bearer token')
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

/**
 * リクエストに対して非同期マッピング関数を適用するミドルウェア
 *
 * @param fn - 非同期リクエスト変換関数
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const addDynamicToken = mapRequestAsync(async (request) => {
 *   const token = await getTokenFromStorage();
 *   return request.withHeader('Authorization', `Bearer ${token}`);
 * });
 * ```
 */
export const mapRequestAsync = (fn: (request: HttpRequest) => Promise<HttpRequest>): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      const modifiedRequest = await fn(request);
      return next(modifiedRequest, options);
    };
  };
};

/**
 * レスポンスに対して非同期マッピング関数を適用するミドルウェア
 *
 * @param fn - 非同期レスポンス変換関数
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const cacheResponse = mapResponseAsync(async (response) => {
 *   await saveToCache(response);
 *   return response;
 * });
 * ```
 */
export const mapResponseAsync = (
  fn: (response: HttpResponse) => Promise<HttpResponse>,
): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      const response = await next(request, options);
      return fn(response);
    };
  };
};

/**
 * 条件付きでミドルウェアを適用する
 *
 * @param condition - ミドルウェアを適用するかどうかを判定する関数
 * @param middleware - 条件が真の場合に適用するミドルウェア
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const authMiddleware = conditional(
 *   (request) => request.uri.includes('/api/'),
 *   mapRequest((request) => request.withHeader('Authorization', 'Bearer token'))
 * );
 * ```
 */
export const conditional = (
  condition: (request: HttpRequest, options: RequestOptions) => boolean,
  middleware: Middleware,
): Middleware => {
  return (next: Handler) => {
    const middlewareHandler = middleware(next);
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      if (condition(request, options)) {
        return middlewareHandler(request, options);
      }
      return next(request, options);
    };
  };
};

/**
 * エラーハンドリングミドルウェアを作成する
 *
 * @param onError - エラー時に実行される関数
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const errorLogger = handleErrors((error, request) => {
 *   console.error('Request failed:', request.uri, error.message);
 *   throw error; // エラーを再スロー
 * });
 * ```
 */
export const handleErrors = (
  onError: (error: Error, request: HttpRequest, options: RequestOptions) => void | Promise<void>,
): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      try {
        return await next(request, options);
      } catch (error) {
        await onError(error as Error, request, options);
        throw error;
      }
    };
  };
};

/**
 * ミドルウェアを組み合わせて一つのミドルウェアにする
 *
 * @param middlewares - 組み合わせるミドルウェアの配列
 * @returns 組み合わせたミドルウェア
 *
 * @example
 * ```typescript
 * const combined = compose([
 *   mapRequest((req) => req.withHeader('X-Custom', 'value')),
 *   tap((req) => console.log('Sending:', req.uri)),
 *   httpErrors()
 * ]);
 * ```
 */
export const compose = (middlewares: readonly Middleware[]): Middleware => {
  return (next: Handler) => {
    return middlewares.reduceRight((handler, middleware) => middleware(handler), next);
  };
};
