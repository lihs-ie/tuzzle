/**
 * Request/Response history recording middleware
 * Provides functionality for verifying request and response history in tests
 */

import type { Middleware, Handler, RequestOptions } from '../../src/handler/stack.js';
import type { HttpRequest } from '../../src/message/request.js';
import type { HttpResponse } from '../../src/message/response.js';

/**
 * History entry
 */
export type HistoryEntry = {
  readonly request: HttpRequest;
  readonly response: HttpResponse | null;
  readonly error: Error | null;
  readonly options: RequestOptions;
};

/**
 * History container
 */
export type HistoryContainer = readonly HistoryEntry[];

/**
 * Middleware for recording request/response history
 *
 * @param container - Mutable reference to store history
 * @returns Middleware
 *
 * @example
 * ```typescript
 * const history = { current: [] };
 * const middleware = createHistoryMiddleware(history);
 *
 * // Add middleware to stack
 * const stack = push(HandlerStack(), middleware, 'history');
 *
 * // After sending request, it will be recorded in history.current
 * await client.get('/api/users');
 * console.log(history.current[0].request.uri); // '/api/users'
 * ```
 */
export const createHistoryMiddleware = (container: { current: HistoryEntry[] }): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
      try {
        const response = await next(request, options);

        // Record successful history
        container.current.push({
          request,
          response,
          error: null,
          options,
        });

        return response;
      } catch (error) {
        // Record error history
        container.current.push({
          request,
          response: null,
          error: error instanceof Error ? error : new Error(String(error)),
          options,
        });

        // Re-throw error
        throw error;
      }
    };
  };
};

/**
 * Clear history
 *
 * @param container - History container
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
 * Get the last history entry
 *
 * @param container - History container
 * @returns Last history entry, or null
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
