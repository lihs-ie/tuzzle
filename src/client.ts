/**
 * HTTP client core implementation
 */

import type { Method } from './method';
import type { HeaderValue } from './message/headers';
import { HttpHeaders } from './message/headers';
import type { HttpRequest } from './message/request';
import { HttpRequest as createHttpRequest } from './message/request';
import type { HttpResponse } from './message/response';
import type { HandlerStack, RequestOptions } from './handler/stack';
import { HandlerStack as createHandlerStack } from './handler/stack';
import { FetchHandler } from './handler/fetch';

/**
 * Client configuration type
 */
export type ClientConfig = {
  readonly baseURL?: string;
  readonly timeout?: number;
  readonly headers?: Readonly<Record<string, HeaderValue>>;
  readonly allowRedirects?: boolean;
  readonly httpErrors?: boolean;
  readonly handlerStack?: HandlerStack;
};

/**
 * Combines baseURL and relative URI
 *
 * @param baseURL - Base URL (optional)
 * @param uri - Request URI
 * @returns Combined URL
 */
const buildUri = (baseURL: string | undefined, uri: string): string => {
  if (!baseURL) {
    return uri;
  }

  // Return as-is if absolute URL
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Remove trailing slash from baseURL
  const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

  // Ensure leading slash in uri
  const normalizedUri = uri.startsWith('/') ? uri : `/${uri}`;

  return `${normalizedBase}${normalizedUri}`;
};

/**
 * Merges client configuration and request options
 *
 * @param clientConfig - Client configuration
 * @param requestOptions - Request options
 * @returns Merged options
 */
const mergeOptions = (
  clientConfig: ClientConfig,
  requestOptions: RequestOptions,
): RequestOptions => {
  const mergedHeaders: Record<string, HeaderValue> = {
    ...(clientConfig.headers ?? {}),
    ...(requestOptions.headers ?? {}),
  };

  return {
    ...clientConfig,
    ...requestOptions,
    headers: mergedHeaders,
  };
};

export interface HttpClient {
  request: (method: Method, uri: string, options?: RequestOptions) => Promise<HttpResponse>;
  get: (uri: string, options?: RequestOptions) => Promise<HttpResponse>;
  post: (uri: string, options?: RequestOptions) => Promise<HttpResponse>;
  put: (uri: string, options?: RequestOptions) => Promise<HttpResponse>;
  delete: (uri: string, options?: RequestOptions) => Promise<HttpResponse>;
  patch: (uri: string, options?: RequestOptions) => Promise<HttpResponse>;
  head: (uri: string, options?: RequestOptions) => Promise<HttpResponse>;
  options: (uri: string, requestOptions?: RequestOptions) => Promise<HttpResponse>;
  getConfig: () => Readonly<ClientConfig>;
}

/**
 * Creates an HTTP client
 *
 * @param config - Client configuration (optional)
 * @returns HTTP client object
 *
 * @example
 * ```typescript
 * const client = HttpClient({ baseURL: 'https://api.example.com' });
 * const response = await client.get('/users');
 * ```
 */
export const HttpClient = (config?: Partial<ClientConfig>): HttpClient => {
  // Default configuration
  const clientConfig: ClientConfig = {
    baseURL: config?.baseURL,
    timeout: config?.timeout,
    headers: config?.headers,
    allowRedirects: config?.allowRedirects,
    httpErrors: config?.httpErrors,
    handlerStack: config?.handlerStack,
  };

  // Prepare handler stack
  let stack = clientConfig.handlerStack ?? createHandlerStack();
  if (!clientConfig.handlerStack) {
    stack = stack.setHandler(FetchHandler());
  }

  const handler = stack.resolve();

  /**
   * Generic request method
   *
   * @param method - HTTP method
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const request = async (
    method: Method,
    uri: string,
    options: RequestOptions = {},
  ): Promise<HttpResponse> => {
    const fullUri = buildUri(clientConfig.baseURL, uri);
    const mergedOptions = mergeOptions(clientConfig, options);

    const httpRequest: HttpRequest = createHttpRequest(method, fullUri, {
      headers: HttpHeaders(mergedOptions.headers),
      body: null,
    });

    return handler(httpRequest, mergedOptions);
  };

  /**
   * Sends a GET request
   *
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const get = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('GET', uri, options);
  };

  /**
   * Sends a POST request
   *
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const post = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('POST', uri, options);
  };

  /**
   * Sends a PUT request
   *
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const put = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('PUT', uri, options);
  };

  /**
   * Sends a DELETE request
   *
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const deleteMethod = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('DELETE', uri, options);
  };

  /**
   * Sends a PATCH request
   *
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const patch = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('PATCH', uri, options);
  };

  /**
   * Sends a HEAD request
   *
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const head = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('HEAD', uri, options);
  };

  /**
   * Sends an OPTIONS request
   *
   * @param uri - Request URI
   * @param options - Request options (optional)
   * @returns Promise of response
   */
  const options = (uri: string, requestOptions: RequestOptions = {}): Promise<HttpResponse> => {
    return request('OPTIONS', uri, requestOptions);
  };

  /**
   * Gets the client configuration
   *
   * @returns Client configuration
   */
  const getConfig = (): Readonly<ClientConfig> => {
    return clientConfig;
  };

  return {
    request,
    get,
    post,
    put,
    delete: deleteMethod,
    patch,
    head,
    options,
    getConfig,
  };
};
