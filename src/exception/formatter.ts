/**
 * エラーメッセージフォーマッター
 * HTTPエラーの詳細な情報を含むメッセージを生成します
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';
import type { HttpBodyStream } from '../message/stream.js';

const DEFAULT_MAX_BODY_LENGTH = 120;

/**
 * HTTPエラーメッセージをフォーマットする
 *
 * @param baseMessage - 基本エラーメッセージ
 * @param request - HTTPリクエスト
 * @param response - HTTPレスポンス（null の場合もある）
 * @returns フォーマットされたエラーメッセージ
 *
 * @example
 * ```typescript
 * const message = formatErrorMessage('Request failed', request, response);
 * // "Request failed: GET https://example.com/api - 404 Not Found"
 * ```
 */
export const formatErrorMessage = (
  baseMessage: string,
  request: HttpRequest,
  response: HttpResponse | null,
): string => {
  const parts: string[] = [baseMessage];

  // リクエスト情報を追加
  parts.push(`${request.method} ${request.uri}`);

  // レスポンス情報を追加（存在する場合）
  if (response) {
    parts.push(`${response.statusCode} ${response.reasonPhrase}`);

    // ボディのサマリーを追加
    const bodySummary = summarizeBodyStream(response.body);
    if (bodySummary) {
      parts.push(`Body: ${bodySummary}`);
    }
  }

  return parts.join(' - ');
};

/**
 * HttpBodyStream から文字列を抽出して要約する
 *
 * @param bodyStream - HttpBodyStream（null の場合もある）
 * @param maxLength - 最大長（デフォルト: 120）
 * @returns 要約されたボディ文字列
 *
 * @example
 * ```typescript
 * const summary = summarizeBodyStream(response.body);
 * ```
 */
export const summarizeBodyStream = (
  bodyStream: HttpBodyStream | null,
  maxLength: number = DEFAULT_MAX_BODY_LENGTH,
): string => {
  if (!bodyStream || bodyStream.content === null) {
    return '';
  }

  // 文字列の場合のみ要約（Blob や ReadableStream は扱わない）
  if (typeof bodyStream.content === 'string') {
    return summarizeBody(bodyStream.content, maxLength);
  }

  return '';
};

/**
 * レスポンスボディを要約する
 * 長いボディは切り詰め、HTMLタグは除去されます
 *
 * @param body - レスポンスボディ
 * @param maxLength - 最大長（デフォルト: 120）
 * @returns 要約されたボディ文字列
 *
 * @example
 * ```typescript
 * const summary = summarizeBody('<html><body>Error</body></html>');
 * // "Error"
 *
 * const longSummary = summarizeBody('a'.repeat(200), 50);
 * // "aaa...aaa" (50文字 + "...")
 * ```
 */
export const summarizeBody = (
  body: string | null | undefined,
  maxLength: number = DEFAULT_MAX_BODY_LENGTH,
): string => {
  if (!body) {
    return '';
  }

  // 空白のみの文字列は空文字列として扱う
  const trimmed = body.trim();
  if (!trimmed) {
    return '';
  }

  let processed = trimmed;

  // HTMLタグを除去
  processed = processed.replace(/<[^>]*>/g, '');

  // 連続する空白を単一のスペースに変換
  processed = processed.replace(/\s+/g, ' ');

  // 再度トリム
  processed = processed.trim();

  // 最大長で切り詰め
  if (processed.length > maxLength) {
    return processed.slice(0, maxLength) + '...';
  }

  return processed;
};
