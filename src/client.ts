/**
 * HTTP クライアントコア実装
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
 * クライアント設定の型
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
 * baseURL と相対 URI を結合する
 *
 * @param baseURL - ベース URL（省略可）
 * @param uri - リクエスト URI
 * @returns 結合された URL
 */
const buildUri = (baseURL: string | undefined, uri: string): string => {
  if (!baseURL) {
    return uri;
  }

  // 絶対URLの場合はそのまま返す
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // baseURLの末尾のスラッシュを削除
  const normalizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

  // uriの先頭のスラッシュを確保
  const normalizedUri = uri.startsWith('/') ? uri : `/${uri}`;

  return `${normalizedBase}${normalizedUri}`;
};

/**
 * クライアント設定とリクエストオプションをマージする
 *
 * @param clientConfig - クライアント設定
 * @param requestOptions - リクエストオプション
 * @returns マージされたオプション
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
 * HTTP クライアントを生成する
 *
 * @param config - クライアント設定（省略可）
 * @returns HTTP クライアントオブジェクト
 *
 * @example
 * ```typescript
 * const client = HttpClient({ baseURL: 'https://api.example.com' });
 * const response = await client.get('/users');
 * ```
 */
export const HttpClient = (config?: Partial<ClientConfig>): HttpClient => {
  // デフォルト設定
  const clientConfig: ClientConfig = {
    baseURL: config?.baseURL,
    timeout: config?.timeout,
    headers: config?.headers,
    allowRedirects: config?.allowRedirects,
    httpErrors: config?.httpErrors,
    handlerStack: config?.handlerStack,
  };

  // ハンドラースタックの準備
  let stack = clientConfig.handlerStack ?? createHandlerStack();
  if (!clientConfig.handlerStack) {
    stack = stack.setHandler(FetchHandler());
  }

  const handler = stack.resolve();

  /**
   * 汎用リクエストメソッド
   *
   * @param method - HTTP メソッド
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
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
   * GET リクエストを送信する
   *
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
   */
  const get = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('GET', uri, options);
  };

  /**
   * POST リクエストを送信する
   *
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
   */
  const post = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('POST', uri, options);
  };

  /**
   * PUT リクエストを送信する
   *
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
   */
  const put = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('PUT', uri, options);
  };

  /**
   * DELETE リクエストを送信する
   *
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
   */
  const deleteMethod = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('DELETE', uri, options);
  };

  /**
   * PATCH リクエストを送信する
   *
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
   */
  const patch = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('PATCH', uri, options);
  };

  /**
   * HEAD リクエストを送信する
   *
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
   */
  const head = (uri: string, options: RequestOptions = {}): Promise<HttpResponse> => {
    return request('HEAD', uri, options);
  };

  /**
   * OPTIONS リクエストを送信する
   *
   * @param uri - リクエスト URI
   * @param options - リクエストオプション（省略可）
   * @returns レスポンスの Promise
   */
  const options = (uri: string, requestOptions: RequestOptions = {}): Promise<HttpResponse> => {
    return request('OPTIONS', uri, requestOptions);
  };

  /**
   * クライアント設定を取得する
   *
   * @returns クライアント設定
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
