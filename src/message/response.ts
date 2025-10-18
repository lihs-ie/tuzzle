/**
 * HTTP レスポンスの型定義と操作関数
 */

import type { HttpBodyStream } from './stream';
import { HttpHeaders } from './headers';
import type { HttpHeaders as HttpHeadersType } from './headers';

const DEFAULT_HTTP_VERSION = '1.1';
const HEADER_LINE_SEPARATOR = ', ';

/**
 * HTTP ステータスコードと理由句のマッピング
 */
const REASON_PHRASES: Readonly<Record<number, string>> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  304: 'Not Modified',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

/**
 * ステータスコードから理由句を取得する
 *
 * @param statusCode - HTTP ステータスコード
 * @returns 理由句。未定義の場合は空文字列
 */
const getReasonPhrase = (statusCode: number): string => REASON_PHRASES[statusCode] ?? '';

/**
 * HTTP レスポンスの型
 */
export interface HttpResponse {
  readonly statusCode: number;
  readonly reasonPhrase: string;
  readonly headers: HttpHeadersType;
  readonly body: HttpBodyStream | null;
  readonly version: string;

  // メソッドスタイル
  readonly withStatus: (statusCode: number, reasonPhrase?: string) => HttpResponse;
  readonly withHeader: (key: string, value: string | readonly string[]) => HttpResponse;
  readonly withoutHeader: (key: string) => HttpResponse;
  readonly withBody: (body: HttpBodyStream | null) => HttpResponse;
  readonly withVersion: (version: string) => HttpResponse;
  readonly getHeader: (key: string) => string | readonly string[] | undefined;
  readonly hasHeader: (key: string) => boolean;
  readonly getHeaderLine: (key: string) => string;
}

/**
 * 新しい HTTP レスポンスを生成する
 *
 * @param statusCode - HTTP ステータスコード
 * @param options - オプション設定（reasonPhrase, headers, body, version）
 * @returns 新しい HttpResponse オブジェクト
 */
export const HttpResponse = (
  statusCode: number,
  options?: Partial<
    Omit<
      HttpResponse,
      | 'statusCode'
      | 'withStatus'
      | 'withHeader'
      | 'withoutHeader'
      | 'withBody'
      | 'withVersion'
      | 'getHeader'
      | 'hasHeader'
      | 'getHeaderLine'
    >
  >,
): HttpResponse => ({
  statusCode,
  reasonPhrase: options?.reasonPhrase ?? getReasonPhrase(statusCode),
  headers: options?.headers ?? HttpHeaders(),
  body: options?.body ?? null,
  version: options?.version ?? DEFAULT_HTTP_VERSION,

  withStatus(newStatusCode: number, newReasonPhrase?: string): HttpResponse {
    return HttpResponse(newStatusCode, {
      reasonPhrase: newReasonPhrase ?? getReasonPhrase(newStatusCode),
      headers: this.headers,
      body: this.body,
      version: this.version,
    });
  },

  withHeader(key: string, value: string | readonly string[]): HttpResponse {
    return HttpResponse(this.statusCode, {
      reasonPhrase: this.reasonPhrase,
      headers: this.headers.set(key, value),
      body: this.body,
      version: this.version,
    });
  },

  withoutHeader(key: string): HttpResponse {
    const newHeaders = this.headers.remove(key);
    if (newHeaders === this.headers) {
      return this;
    }
    return HttpResponse(this.statusCode, {
      reasonPhrase: this.reasonPhrase,
      headers: newHeaders,
      body: this.body,
      version: this.version,
    });
  },

  withBody(newBody: HttpBodyStream | null): HttpResponse {
    return HttpResponse(this.statusCode, {
      reasonPhrase: this.reasonPhrase,
      headers: this.headers,
      body: newBody,
      version: this.version,
    });
  },

  withVersion(newVersion: string): HttpResponse {
    return HttpResponse(this.statusCode, {
      reasonPhrase: this.reasonPhrase,
      headers: this.headers,
      body: this.body,
      version: newVersion,
    });
  },

  getHeader(key: string): string | readonly string[] | undefined {
    return this.headers.get(key);
  },

  hasHeader(key: string): boolean {
    return this.headers.has(key);
  },

  getHeaderLine(key: string): string {
    const value = this.headers.get(key);
    if (value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    return value.join(HEADER_LINE_SEPARATOR);
  },
});
