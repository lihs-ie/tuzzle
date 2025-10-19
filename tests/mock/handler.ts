/**
 * Mock handler
 * Handler that returns test responses or errors from a queue
 */

import type { Handler, RequestOptions, TransferStats } from '../../src/handler/stack.js';
import type { HttpRequest } from '../../src/message/request.js';
import type { HttpResponse } from '../../src/message/response.js';
import type { HttpBodyStream } from '../../src/message/stream.js';

/**
 * Mock item type
 * Can be a response, error, or custom function
 */
export type MockItem =
  | HttpResponse
  | Error
  | ((request: HttpRequest, options: RequestOptions) => HttpResponse | Promise<HttpResponse>);

/**
 * Mock handler state
 */
type MockHandler = {
  readonly queue: readonly MockItem[];
  readonly lastRequest: HttpRequest | null;
  readonly lastOptions: RequestOptions | null;
  readonly onFulfilled?: (response: HttpResponse) => void;
  readonly onRejected?: (error: Error) => void;
};

/**
 * Read string from HttpBodyStream
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

  // For ReadableStream
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
 * Handle sink option
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
    // If file path
    const fs = await import('fs');
    await fs.promises.writeFile(sink, content);
  } else {
    // If WriteStream
    sink.write(content);
  }
};

/**
 * Create mock handler
 *
 * @param options - Options
 * @returns Mock handler function
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
    // Save request information
    state = {
      ...state,
      lastRequest: request,
      lastOptions: requestOptions,
    };

    // Error if queue is empty
    if (state.queue.length === 0) {
      const error = new Error('Mock queue is empty');
      if (state.onRejected) {
        state.onRejected(error);
      }
      throw error;
    }

    // Handle delay option
    if (requestOptions.delay && typeof requestOptions.delay === 'number') {
      await new Promise((resolve) => setTimeout(resolve, requestOptions.delay));
    }

    // Get next item from queue
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

    // Execute on_headers callback
    if (requestOptions.onHeaders && typeof requestOptions.onHeaders === 'function') {
      try {
        if (item instanceof Error) {
          // Don't execute callback for errors
        } else if (typeof item === 'function') {
          // Execute function first, then callback
          const response = await item(request, requestOptions);
          requestOptions.onHeaders(response);
        } else {
          // Callback with response as-is
          requestOptions.onHeaders(item);
        }
      } catch (error) {
        // If error occurs in on_headers
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

    // Process based on item type
    if (item instanceof Error) {
      // If error
      if (state.onRejected) {
        state.onRejected(item);
      }
      throw item;
    } else if (typeof item === 'function') {
      // If function, execute it
      const response = await item(request, requestOptions);

      // Execute on_stats callback
      if (requestOptions.onStats && typeof requestOptions.onStats === 'function') {
        const stats: TransferStats = {
          request,
          response,
          transferTime: 0,
          error: null,
        };
        requestOptions.onStats(stats);
      }

      // Handle sink option
      if (requestOptions.sink && response.body) {
        await handleSink(requestOptions.sink, response);
      }

      if (state.onFulfilled) {
        state.onFulfilled(response);
      }

      return response;
    } else {
      // If response
      const response = item;

      // Execute on_stats callback
      if (requestOptions.onStats && typeof requestOptions.onStats === 'function') {
        const stats: TransferStats = {
          request,
          response,
          transferTime: 0,
          error: null,
        };
        requestOptions.onStats(stats);
      }

      // Handle sink option
      if (requestOptions.sink && response.body) {
        await handleSink(requestOptions.sink, response);
      }

      if (state.onFulfilled) {
        state.onFulfilled(response);
      }

      return response;
    }
  };

  // Add helper methods
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
 * Get the last processed request
 *
 * @param handler - Handler
 * @returns Last request, or null
 */
export const getLastRequest = (handler: Handler): HttpRequest | null => {
  return (
    (handler as Handler & { getLastRequest?: () => HttpRequest | null }).getLastRequest?.() ?? null
  );
};

/**
 * Get the last processed request options
 *
 * @param handler - Handler
 * @returns Last request options, or null
 */
export const getLastOptions = (handler: Handler): RequestOptions | null => {
  return (
    (handler as Handler & { getLastOptions?: () => RequestOptions | null }).getLastOptions?.() ??
    null
  );
};

/**
 * Get remaining item count in mock queue
 *
 * @param handler - Handler
 * @returns Remaining queue count
 */
export const countMockQueue = (handler: Handler): number => {
  return (handler as Handler & { count?: () => number }).count?.() ?? 0;
};

/**
 * Reset mock queue
 *
 * @param handler - Handler
 */
export const resetMockQueue = (handler: Handler): void => {
  (handler as Handler & { reset?: () => void }).reset?.();
};

/**
 * Append items to mock queue
 *
 * @param handler - Handler
 * @param items - Items to append
 */
export const appendMockQueue = (handler: Handler, ...items: MockItem[]): void => {
  (handler as Handler & { append?: (...items: MockItem[]) => void }).append?.(...items);
};
