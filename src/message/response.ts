/**
 * HTTP レスポンスの型定義と操作関数
 */

import type { HttpBodyStream } from './stream';
import {
  setHeader as setHeaderInHeaders,
  removeHeader as removeHeaderFromHeaders,
  getHeader as getHeaderFromHeaders,
  hasHeader as hasHeaderInHeaders,
  type HttpHeaders,
} from './headers';

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
export type HttpResponse = {
  readonly statusCode: number;
  readonly reasonPhrase: string;
  readonly headers: HttpHeaders;
  readonly body: HttpBodyStream | null;
  readonly version: string;
};

/**
 * 新しい HTTP レスポンスを生成する
 *
 * @param statusCode - HTTP ステータスコード
 * @param options - オプション設定（reasonPhrase, headers, body, version）
 * @returns 新しい HttpResponse オブジェクト
 */
export const HttpResponse = (
  statusCode: number,
  options?: Partial<Omit<HttpResponse, 'statusCode'>>,
): HttpResponse => ({
  statusCode,
  reasonPhrase: options?.reasonPhrase ?? getReasonPhrase(statusCode),
  headers: options?.headers ?? {},
  body: options?.body ?? null,
  version: options?.version ?? DEFAULT_HTTP_VERSION,
});

/**
 * ステータスコードと理由句を変更した新しいレスポンスを返す
 *
 * @param response - 元のレスポンス
 * @param statusCode - 新しいステータスコード
 * @param reasonPhrase - 新しい理由句（省略時は自動判定）
 * @returns ステータスが更新された新しいレスポンス
 */
export const withStatus = (
  response: HttpResponse,
  statusCode: number,
  reasonPhrase?: string,
): HttpResponse => ({
  ...response,
  statusCode,
  reasonPhrase: reasonPhrase ?? getReasonPhrase(statusCode),
});

/**
 * ヘッダーを追加・更新した新しいレスポンスを返す
 *
 * @param response - 元のレスポンス
 * @param key - ヘッダーキー
 * @param value - ヘッダー値
 * @returns ヘッダーが更新された新しいレスポンス
 */
export const withHeader = (
  response: HttpResponse,
  key: string,
  value: string | readonly string[],
): HttpResponse => ({
  ...response,
  headers: setHeaderInHeaders(response.headers, key, value),
});

/**
 * ヘッダーを削除した新しいレスポンスを返す
 *
 * @param response - 元のレスポンス
 * @param key - 削除するヘッダーキー
 * @returns ヘッダーが削除された新しいレスポンス
 */
export const withoutHeader = (response: HttpResponse, key: string): HttpResponse => {
  const newHeaders = removeHeaderFromHeaders(response.headers, key);

  // ヘッダーが変更されなかった場合は元のオブジェクトを返す
  if (newHeaders === response.headers) {
    return response;
  }

  return {
    ...response,
    headers: newHeaders,
  };
};

/**
 * ボディを変更した新しいレスポンスを返す
 *
 * @param response - 元のレスポンス
 * @param body - 新しいボディ
 * @returns ボディが更新された新しいレスポンス
 */
export const withBody = (response: HttpResponse, body: HttpBodyStream | null): HttpResponse => ({
  ...response,
  body,
});

/**
 * HTTP バージョンを変更した新しいレスポンスを返す
 *
 * @param response - 元のレスポンス
 * @param version - 新しい HTTP バージョン
 * @returns バージョンが更新された新しいレスポンス
 */
export const withVersion = (response: HttpResponse, version: string): HttpResponse => ({
  ...response,
  version,
});

/**
 * ヘッダー値を取得する（大文字小文字を区別しない）
 *
 * @param response - 検索対象のレスポンス
 * @param key - 取得したいヘッダーキー
 * @returns 見つかったヘッダー値。存在しない場合は undefined
 */
export const getHeader = (
  response: HttpResponse,
  key: string,
): string | readonly string[] | undefined => getHeaderFromHeaders(response.headers, key);

/**
 * ヘッダーの存在を確認する（大文字小文字を区別しない）
 *
 * @param response - 検査対象のレスポンス
 * @param key - 存在確認したいヘッダーキー
 * @returns 指定したヘッダーが存在する場合は true
 */
export const hasHeader = (response: HttpResponse, key: string): boolean =>
  hasHeaderInHeaders(response.headers, key);

/**
 * ヘッダー値を単一の文字列として取得する
 * 配列の場合はカンマ区切りで結合する
 *
 * @param response - 検索対象のレスポンス
 * @param key - 取得したいヘッダーキー
 * @returns ヘッダー値の文字列。存在しない場合は空文字列
 */
export const getHeaderLine = (response: HttpResponse, key: string): string => {
  const value = getHeaderFromHeaders(response.headers, key);

  if (value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  // 配列の場合はカンマ区切りで結合
  return value.join(HEADER_LINE_SEPARATOR);
};
