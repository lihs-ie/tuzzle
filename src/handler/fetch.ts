/**
 * Default handler based on fetch API
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';
import { HttpBodyStream } from '../message/stream';
import { HttpResponse as createHttpResponse } from '../message/response';
import { HttpHeaders } from '../message/headers';
import type { Handler, RequestOptions } from './stack';

/**
 * Converts a fetch Response to HttpResponse
 *
 * @param response - Response object from fetch API
 * @returns HttpResponse object
 */
const convertFetchResponse = async (response: Response): Promise<HttpResponse> => {
  const headersRecord: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headersRecord[key] = value;
  });

  const bodyText = await response.text();
  const body = HttpBodyStream(bodyText);

  return createHttpResponse(response.status, {
    reasonPhrase: response.statusText,
    headers: HttpHeaders(headersRecord),
    body,
  });
};

/**
 * Default handler using fetch API
 *
 * @returns Handler function
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
      headers: request.headers.data as HeadersInit,
      body: request.body?.content !== undefined ? (request.body.content as BodyInit) : null,
    };

    // Timeout option processing
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

    // Normal processing without timeout
    const response = await fetch(request.uri, fetchOptions);
    return convertFetchResponse(response);
  };
};
