/**
 * HTTPエラーミドルウェア
 * httpErrors オプションが true の場合、4xx/5xx レスポンスを例外としてスローします
 */

import type { Middleware } from '../handler/stack.js';
import { createClientError, throwClientError } from '../exception/client.js';
import { createServerError, throwServerError } from '../exception/server.js';
import { formatErrorMessage } from '../exception/formatter.js';

/**
 * HTTPエラーを例外化するミドルウェア
 *
 * RequestOptions の httpErrors が true の場合、
 * 4xx レスポンスは ClientError、5xx レスポンスは ServerError としてスローされます
 *
 * @returns ミドルウェア関数
 *
 * @example
 * ```typescript
 * const stack = HandlerStack(fetchHandler);
 * const withErrors = push(stack, httpErrors(), 'http_errors');
 * ```
 */
export const httpErrors = (): Middleware => {
  return (next) => async (request, options) => {
    const response = await next(request, options);

    // httpErrors オプションが false または未設定の場合はスキップ
    if (!options.httpErrors) {
      return response;
    }

    const statusCode = response.statusCode;

    // 4xx クライアントエラー
    if (statusCode >= 400 && statusCode < 500) {
      const message = formatErrorMessage(
        `Client error: ${statusCode} ${response.reasonPhrase}`,
        request,
        response,
      );
      const error = createClientError(message, request, response);
      throwClientError(error);
    }

    // 5xx サーバーエラー
    if (statusCode >= 500 && statusCode < 600) {
      const message = formatErrorMessage(
        `Server error: ${statusCode} ${response.reasonPhrase}`,
        request,
        response,
      );
      const error = createServerError(message, request, response);
      throwServerError(error);
    }

    return response;
  };
};
