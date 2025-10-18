/**
 * リクエスト・レスポンス履歴記録ミドルウェア
 * テストでリクエストとレスポンスの履歴を検証するための機能
 */

import type { Middleware, Handler, RequestOptions } from '../../src/handler/stack.js';
import type { HttpRequest } from '../../src/message/request.js';
import type { HttpResponse } from '../../src/message/response.js';

/**
 * 履歴エントリー
 */
export type HistoryEntry = {
  readonly request: HttpRequest;
  readonly response: HttpResponse | null;
  readonly error: Error | null;
  readonly options: RequestOptions;
};

/**
 * 履歴コンテナ
 */
export type HistoryContainer = readonly HistoryEntry[];

/**
 * リクエスト・レスポンスの履歴を記録するミドルウェア
 *
 * @param container - 履歴を格納する配列（ミュータブルな参照）
 * @returns ミドルウェア
 *
 * @example
 * ```typescript
 * const history = { current: [] };
 * const middleware = createHistoryMiddleware(history);
 *
 * // ミドルウェアをスタックに追加
 * const stack = push(HandlerStack(), middleware, 'history');
 *
 * // リクエスト送信後、history.current に記録される
 * await client.get('/api/users');
 * console.log(history.current[0].request.uri); // '/api/users'
 * ```
 */
export const createHistoryMiddleware = (container: { current: HistoryEntry[] }): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      try {
        const response = await next(request, options);

        // 成功時の履歴を記録
        container.current.push({
          request,
          response,
          error: null,
          options,
        });

        return response;
      } catch (error) {
        // エラー時の履歴を記録
        container.current.push({
          request,
          response: null,
          error: error instanceof Error ? error : new Error(String(error)),
          options,
        });

        // エラーを再スロー
        throw error;
      }
    };
  };
};

/**
 * 履歴をクリアする
 *
 * @param container - 履歴コンテナ
 *
 * @example
 * ```typescript
 * const history = { current: [] };
 * // ... some requests
 * clearHistory(history);
 * console.log(history.current.length); // 0
 * ```
 */
export const clearHistory = (container: { current: HistoryEntry[] }): void => {
  container.current = [];
};

/**
 * 最後の履歴エントリーを取得する
 *
 * @param container - 履歴コンテナ
 * @returns 最後の履歴エントリー、または null
 *
 * @example
 * ```typescript
 * const history = { current: [] };
 * // ... some requests
 * const last = getLastHistoryEntry(history);
 * if (last) {
 *   console.log(last.request.method);
 * }
 * ```
 */
export const getLastHistoryEntry = (container: {
  current: HistoryEntry[];
}): HistoryEntry | null => {
  if (container.current.length === 0) {
    return null;
  }

  return container.current[container.current.length - 1] ?? null;
};
