/**
 * HTTP Error Middleware
 * When httpErrors option is true, throws 4xx/5xx responses as exceptions
 */

import type { Middleware } from '../handler/stack.js';
import { createClientError, throwClientError } from '../exception/client.js';
import { createServerError, throwServerError } from '../exception/server.js';
import { formatErrorMessage } from '../exception/formatter.js';

/**
 * Middleware that converts HTTP errors into exceptions
 *
 * When RequestOptions.httpErrors is true,
 * 4xx responses are thrown as ClientError, 5xx responses as ServerError
 *
 * @returns Middleware function
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

    // Skip if httpErrors option is false or not set
    if (!options.httpErrors) {
      return response;
    }

    const statusCode = response.statusCode;

    // 4xx Client errors
    if (statusCode >= 400 && statusCode < 500) {
      const message = formatErrorMessage(
        `Client error: ${statusCode} ${response.reasonPhrase}`,
        request,
        response,
      );
      const error = createClientError(message, request, response);
      throwClientError(error);
    }

    // 5xx Server errors
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
