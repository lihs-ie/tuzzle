/**
 * fetch API ベースのデフォルトハンドラー
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';
import { HttpBodyStream } from '../message/stream';
import { HttpResponse as createHttpResponse } from '../message/response';
import type { Handler, RequestOptions } from './stack';

/**
 * fetch Response を HttpResponse に変換する
 *
 * @param response - fetch API の Response オブジェクト
 * @returns HttpResponse オブジェクト
 */
const convertFetchResponse = async (response: Response): Promise<HttpResponse> => {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const bodyText = await response.text();
  const body = HttpBodyStream(bodyText);

  return createHttpResponse(response.status, {
    reasonPhrase: response.statusText,
    headers,
    body,
  });
};

/**
 * fetch API を使用したデフォルトハンドラー
 *
 * @returns Handler 関数
 *
 * @example
 * ```typescript
 * const handler = FetchHandler();
 * const response = await handler(request, { timeout: 5000 });
 * ```
 */
export const FetchHandler = (): Handler => {
  return async (request: HttpRequest, options: RequestOptions): Promise<HttpResponse> => {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: request.headers as HeadersInit,
      body: request.body?.content !== undefined ? (request.body.content as BodyInit) : null,
    };

    // タイムアウトオプションの処理
    if (options.timeout && typeof options.timeout === 'number') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout);
      fetchOptions.signal = controller.signal;

      try {
        const response = await fetch(request.uri, fetchOptions);
        clearTimeout(timeoutId);
        return await convertFetchResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }

    // タイムアウトなしの通常処理
    const response = await fetch(request.uri, fetchOptions);
    return convertFetchResponse(response);
  };
};
