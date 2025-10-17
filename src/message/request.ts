/**
 * HTTP リクエストの型定義と操作関数
 */

import type { Method } from '../method';
import type { HttpBodyStream } from './stream';
import {
  setHeader as setHeaderInHeaders,
  removeHeader as removeHeaderFromHeaders,
  getHeader as getHeaderFromHeaders,
  hasHeader as hasHeaderInHeaders,
  type HttpHeaders,
} from './headers';

const DEFAULT_HTTP_VERSION = '1.1';

/**
 * HTTP リクエストの型
 */
export type HttpRequest = {
  readonly method: Method;
  readonly uri: string;
  readonly headers: HttpHeaders;
  readonly body: HttpBodyStream | null;
  readonly version: string;
};

/**
 * 新しい HTTP リクエストを生成する
 *
 * @param method - HTTP メソッド
 * @param uri - リクエスト URI
 * @param options - オプション設定（headers, body, version）
 * @returns 新しい HttpRequest オブジェクト
 */
export const HttpRequest = (
  method: Method,
  uri: string,
  options?: Partial<Omit<HttpRequest, 'method' | 'uri'>>,
): HttpRequest => ({
  method,
  uri,
  headers: options?.headers ?? {},
  body: options?.body ?? null,
  version: options?.version ?? DEFAULT_HTTP_VERSION,
});

/**
 * メソッドを変更した新しいリクエストを返す
 *
 * @param request - 元のリクエスト
 * @param method - 新しい HTTP メソッド
 * @returns メソッドが更新された新しいリクエスト
 */
export const withMethod = (request: HttpRequest, method: Method): HttpRequest => ({
  ...request,
  method,
});

/**
 * URI を変更した新しいリクエストを返す
 *
 * @param request - 元のリクエスト
 * @param uri - 新しい URI
 * @returns URI が更新された新しいリクエスト
 */
export const withUri = (request: HttpRequest, uri: string): HttpRequest => ({
  ...request,
  uri,
});

/**
 * ヘッダーを追加・更新した新しいリクエストを返す
 *
 * @param request - 元のリクエスト
 * @param key - ヘッダーキー
 * @param value - ヘッダー値
 * @returns ヘッダーが更新された新しいリクエスト
 */
export const withHeader = (
  request: HttpRequest,
  key: string,
  value: string | readonly string[],
): HttpRequest => ({
  ...request,
  headers: setHeaderInHeaders(request.headers, key, value),
});

/**
 * ヘッダーを削除した新しいリクエストを返す
 *
 * @param request - 元のリクエスト
 * @param key - 削除するヘッダーキー
 * @returns ヘッダーが削除された新しいリクエスト
 */
export const withoutHeader = (request: HttpRequest, key: string): HttpRequest => {
  const newHeaders = removeHeaderFromHeaders(request.headers, key);

  // ヘッダーが変更されなかった場合は元のオブジェクトを返す
  if (newHeaders === request.headers) {
    return request;
  }

  return {
    ...request,
    headers: newHeaders,
  };
};

/**
 * ボディを変更した新しいリクエストを返す
 *
 * @param request - 元のリクエスト
 * @param body - 新しいボディ
 * @returns ボディが更新された新しいリクエスト
 */
export const withBody = (request: HttpRequest, body: HttpBodyStream | null): HttpRequest => ({
  ...request,
  body,
});

/**
 * HTTP バージョンを変更した新しいリクエストを返す
 *
 * @param request - 元のリクエスト
 * @param version - 新しい HTTP バージョン
 * @returns バージョンが更新された新しいリクエスト
 */
export const withVersion = (request: HttpRequest, version: string): HttpRequest => ({
  ...request,
  version,
});

/**
 * ヘッダー値を取得する（大文字小文字を区別しない）
 *
 * @param request - 検索対象のリクエスト
 * @param key - 取得したいヘッダーキー
 * @returns 見つかったヘッダー値。存在しない場合は undefined
 */
export const getHeader = (
  request: HttpRequest,
  key: string,
): string | readonly string[] | undefined => getHeaderFromHeaders(request.headers, key);

/**
 * ヘッダーの存在を確認する（大文字小文字を区別しない）
 *
 * @param request - 検査対象のリクエスト
 * @param key - 存在確認したいヘッダーキー
 * @returns 指定したヘッダーが存在する場合は true
 */
export const hasHeader = (request: HttpRequest, key: string): boolean =>
  hasHeaderInHeaders(request.headers, key);
