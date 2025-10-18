/**
 * モックハンドラー
 * テスト用のレスポンスやエラーをキューから返すハンドラー
 */

import type { Handler, RequestOptions, TransferStats } from '../../src/handler/stack.js';
import type { HttpRequest } from '../../src/message/request.js';
import type { HttpResponse } from '../../src/message/response.js';
import type { HttpBodyStream } from '../../src/message/stream.js';

/**
 * モックアイテムの型
 * レスポンス・エラー・カスタム関数のいずれか
 */
export type MockItem =
  | HttpResponse
  | Error
  | ((request: HttpRequest, options: RequestOptions) => HttpResponse | Promise<HttpResponse>);

/**
 * モックハンドラーの状態
 */
type MockHandler = {
  readonly queue: readonly MockItem[];
  readonly lastRequest: HttpRequest | null;
  readonly lastOptions: RequestOptions | null;
  readonly onFulfilled?: (response: HttpResponse) => void;
  readonly onRejected?: (error: Error) => void;
};

/**
 * HttpBodyStream から文字列を読み取る
 */
const streamToString = async (stream: HttpBodyStream): Promise<string> => {
  if (stream.content === null) {
    return '';
  }

  if (typeof stream.content === 'string') {
    return stream.content;
  }

  if (stream.content instanceof Blob) {
    return await stream.content.text();
  }

  // ReadableStream の場合
  const reader = stream.content.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode(); // flush
  return result;
};

/**
 * sink オプションの処理
 */
const handleSink = async (
  sink: string | NodeJS.WriteStream,
  response: HttpResponse,
): Promise<void> => {
  if (!response.body || !response.body.content) {
    return;
  }

  const content = await streamToString(response.body);

  if (typeof sink === 'string') {
    // ファイルパスの場合
    const fs = await import('fs');
    await fs.promises.writeFile(sink, content);
  } else {
    // WriteStream の場合
    sink.write(content);
  }
};

/**
 * モックハンドラーを生成する
 *
 * @param options - オプション
 * @returns モックハンドラー関数
 *
 * @example
 * ```typescript
 * const handler = createMockHandler({
 *   queue: [
 *     HttpResponse(200, { body: HttpBodyStream('OK') }),
 *     HttpResponse(404, { body: HttpBodyStream('Not Found') }),
 *   ],
 * });
 * ```
 */
export const createMockHandler = (options?: {
  queue?: readonly MockItem[];
  onFulfilled?: (response: HttpResponse) => void;
  onRejected?: (error: Error) => void;
}): Handler => {
  let state: MockHandler = {
    queue: options?.queue ?? [],
    lastRequest: null,
    lastOptions: null,
    onFulfilled: options?.onFulfilled,
    onRejected: options?.onRejected,
  };

  const handler: Handler = async (
    request: HttpRequest,
    requestOptions: RequestOptions,
  ): Promise<HttpResponse> => {
    // リクエスト情報を保存
    state = {
      ...state,
      lastRequest: request,
      lastOptions: requestOptions,
    };

    // キューが空の場合はエラー
    if (state.queue.length === 0) {
      const error = new Error('Mock queue is empty');
      if (state.onRejected) {
        state.onRejected(error);
      }
      throw error;
    }

    // delay オプションの処理
    if (requestOptions.delay && typeof requestOptions.delay === 'number') {
      await new Promise((resolve) => setTimeout(resolve, requestOptions.delay));
    }

    // キューから次のアイテムを取得
    const item = state.queue[0];
    if (!item) {
      const error = new Error('Mock queue is empty');
      if (state.onRejected) {
        state.onRejected(error);
      }
      throw error;
    }
    const remainingQueue = state.queue.slice(1);
    state = { ...state, queue: remainingQueue };

    // on_headers コールバックの実行
    if (requestOptions.onHeaders && typeof requestOptions.onHeaders === 'function') {
      try {
        if (item instanceof Error) {
          // エラーの場合はコールバックを実行しない
        } else if (typeof item === 'function') {
          // 関数の場合は実行してからコールバック
          const response = await item(request, requestOptions);
          requestOptions.onHeaders(response);
        } else {
          // レスポンスの場合はそのままコールバック
          requestOptions.onHeaders(item);
        }
      } catch (error) {
        // on_headers でエラーが発生した場合
        const errorMessage = error instanceof Error ? error.message : String(error);
        const wrappedError = new Error(
          `An error was encountered during the on_headers event: ${errorMessage}`,
        );
        if (state.onRejected) {
          state.onRejected(wrappedError);
        }
        throw wrappedError;
      }
    }

    // アイテムの種類に応じて処理
    if (item instanceof Error) {
      // エラーの場合
      if (state.onRejected) {
        state.onRejected(item);
      }
      throw item;
    } else if (typeof item === 'function') {
      // 関数の場合は実行
      const response = await item(request, requestOptions);

      // on_stats コールバックの実行
      if (requestOptions.onStats && typeof requestOptions.onStats === 'function') {
        const stats: TransferStats = {
          request,
          response,
          transferTime: 0,
          error: null,
        };
        requestOptions.onStats(stats);
      }

      // sink オプションの処理
      if (requestOptions.sink && response.body) {
        await handleSink(requestOptions.sink, response);
      }

      if (state.onFulfilled) {
        state.onFulfilled(response);
      }

      return response;
    } else {
      // レスポンスの場合
      const response = item;

      // on_stats コールバックの実行
      if (requestOptions.onStats && typeof requestOptions.onStats === 'function') {
        const stats: TransferStats = {
          request,
          response,
          transferTime: 0,
          error: null,
        };
        requestOptions.onStats(stats);
      }

      // sink オプションの処理
      if (requestOptions.sink && response.body) {
        await handleSink(requestOptions.sink, response);
      }

      if (state.onFulfilled) {
        state.onFulfilled(response);
      }

      return response;
    }
  };

  // ヘルパーメソッドを追加
  (handler as Handler & { getLastRequest: () => HttpRequest | null }).getLastRequest = () =>
    state.lastRequest;
  (handler as Handler & { getLastOptions: () => RequestOptions | null }).getLastOptions = () =>
    state.lastOptions;
  (handler as Handler & { count: () => number }).count = () => state.queue.length;
  (handler as Handler & { reset: () => void }).reset = () => {
    state = { ...state, queue: [] };
  };
  (handler as Handler & { append: (...items: MockItem[]) => void }).append = (
    ...items: MockItem[]
  ) => {
    state = { ...state, queue: [...state.queue, ...items] };
  };

  return handler;
};

/**
 * 最後に処理されたリクエストを取得する
 *
 * @param handler - ハンドラー
 * @returns 最後のリクエスト、または null
 */
export const getLastRequest = (handler: Handler): HttpRequest | null => {
  return (
    (handler as Handler & { getLastRequest?: () => HttpRequest | null }).getLastRequest?.() ?? null
  );
};

/**
 * 最後に処理されたリクエストオプションを取得する
 *
 * @param handler - ハンドラー
 * @returns 最後のリクエストオプション、または null
 */
export const getLastOptions = (handler: Handler): RequestOptions | null => {
  return (
    (handler as Handler & { getLastOptions?: () => RequestOptions | null }).getLastOptions?.() ??
    null
  );
};

/**
 * モックキューの残りアイテム数を取得する
 *
 * @param handler - ハンドラー
 * @returns キューの残り数
 */
export const countMockQueue = (handler: Handler): number => {
  return (handler as Handler & { count?: () => number }).count?.() ?? 0;
};

/**
 * モックキューをリセットする
 *
 * @param handler - ハンドラー
 */
export const resetMockQueue = (handler: Handler): void => {
  (handler as Handler & { reset?: () => void }).reset?.();
};

/**
 * モックキューにアイテムを追加する
 *
 * @param handler - ハンドラー
 * @param items - 追加するアイテム
 */
export const appendMockQueue = (handler: Handler, ...items: MockItem[]): void => {
  (handler as Handler & { append?: (...items: MockItem[]) => void }).append?.(...items);
};
