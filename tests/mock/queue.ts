/**
 * モックレスポンスキュー管理ヘルパー
 * テスト用のレスポンスを簡単に生成するユーティリティ関数
 */

import type { HttpResponse } from '../../src/message/response.js';
import { HttpResponse as createHttpResponse } from '../../src/message/response.js';
import { HttpBodyStream } from '../../src/message/stream.js';
import { HttpHeaders } from '../../src/message/headers.js';

/**
 * 簡単なレスポンスを生成するヘルパー
 *
 * @param statusCode - ステータスコード
 * @param body - ボディ文字列（省略可）
 * @param headers - ヘッダー（省略可）
 * @returns HttpResponse
 *
 * @example
 * ```typescript
 * const response = mockResponse(200, 'OK');
 * const response404 = mockResponse(404, 'Not Found', { 'X-Error': 'true' });
 * ```
 */
export const mockResponse = (
  statusCode: number,
  body?: string,
  headers?: Record<string, string>,
): HttpResponse => {
  return createHttpResponse(statusCode, {
    body: body ? HttpBodyStream(body) : null,
    headers: HttpHeaders(headers ?? {}),
  });
};

/**
 * JSON レスポンスを生成するヘルパー
 *
 * @param statusCode - ステータスコード
 * @param data - JSON データ
 * @param headers - ヘッダー（省略可）
 * @returns HttpResponse
 *
 * @example
 * ```typescript
 * const response = mockJsonResponse(200, { users: ['Alice', 'Bob'] });
 * const error = mockJsonResponse(400, { error: 'Bad request' });
 * ```
 */
export const mockJsonResponse = (
  statusCode: number,
  data: unknown,
  headers?: Record<string, string>,
): HttpResponse => {
  return createHttpResponse(statusCode, {
    body: HttpBodyStream(JSON.stringify(data)),
    headers: HttpHeaders({
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    }),
  });
};

/**
 * エラーレスポンスを生成するヘルパー
 *
 * @param statusCode - ステータスコード
 * @param message - エラーメッセージ
 * @returns HttpResponse
 *
 * @example
 * ```typescript
 * const error404 = mockErrorResponse(404, 'Not found');
 * const error500 = mockErrorResponse(500, 'Internal server error');
 * ```
 */
export const mockErrorResponse = (statusCode: number, message: string): HttpResponse => {
  return mockJsonResponse(statusCode, { error: message });
};
