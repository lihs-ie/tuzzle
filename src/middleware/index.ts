/**
 * Middleware helper functions
 * Equivalent to Guzzle's Middleware class
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';
import type { Handler, Middleware, RequestOptions } from '../handler/stack';

// HTTP error middleware
export { httpErrors } from './http-errors.js';

/**
 * Callback function type executed before sending a request
 */
export type TapBeforeFn = (request: HttpRequest, options: RequestOptions) => void;

/**
 * Callback function type executed after receiving a response
 */
export type TapAfterFn = (
  request: HttpRequest,
  options: RequestOptions,
  response: Promise<HttpResponse>,
) => void;

/**
 * Middleware that applies a mapping function to a request
 *
 * @param fn - Request transformation function
 * @returns Middleware
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
 * Middleware that applies a mapping function to a response
 *
 * @param fn - Response transformation function
 * @returns Middleware
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
 * Middleware that observes requests/responses
 * Does not modify request/response, useful for logging and similar purposes
 *
 * @param before - Function executed before sending request (optional)
 * @param after - Function executed after receiving response (optional)
 * @returns Middleware
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
 * Middleware that applies an async mapping function to a request
 *
 * @param fn - Async request transformation function
 * @returns Middleware
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
 * Middleware that applies an async mapping function to a response
 *
 * @param fn - Async response transformation function
 * @returns Middleware
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
 * Conditionally applies middleware
 *
 * @param condition - Function that determines whether to apply the middleware
 * @param middleware - Middleware to apply when condition is true
 * @returns Middleware
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
 * Creates an error handling middleware
 *
 * @param onError - Function executed when an error occurs
 * @returns Middleware
 *
 * @example
 * ```typescript
 * const errorLogger = handleErrors((error, request) => {
 *   console.error('Request failed:', request.uri, error.message);
 *   throw error; // Re-throw the error
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
 * Composes multiple middlewares into a single middleware
 *
 * @param middlewares - Array of middlewares to compose
 * @returns Composed middleware
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
