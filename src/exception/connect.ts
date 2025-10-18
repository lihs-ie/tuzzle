/**
 * ConnectError - 接続エラー型
 * サーバーへの接続に失敗した場合のエラーを表現します
 */

import type { HttpRequest } from '../message/request.js';

/**
 * ConnectError 型定義
 * TransferError の構造を継承しつつ、接続エラーを表現します
 */
export type ConnectError = {
  readonly type: 'ConnectError';
  readonly message: string;
  readonly request: HttpRequest;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * ConnectError を作成する
 *
 * @param message - エラーメッセージ
 * @param request - HTTPリクエスト
 * @param options - オプション（cause, stack）
 * @returns ConnectError オブジェクト
 *
 * @example
 * ```typescript
 * const error = createConnectError('Connection refused', request);
 * const errorWithCause = createConnectError('ECONNREFUSED', request, { cause: originalError });
 * ```
 */
export const createConnectError = (
  message: string,
  request: HttpRequest,
  options?: { cause?: Error; stack?: string },
): ConnectError => {
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'ConnectError',
    message,
    request,
    cause: options?.cause,
    stack,
  };
};

/**
 * 値が ConnectError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns ConnectError の場合は true
 *
 * @example
 * ```typescript
 * if (isConnectError(error)) {
 *   console.log('Connection failed:', error.request.uri);
 * }
 * ```
 */
export const isConnectError = (value: unknown): value is ConnectError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'ConnectError' &&
    typeof obj.message === 'string' &&
    typeof obj.request === 'object' &&
    obj.request !== null
  );
};

/**
 * ConnectError を JavaScript の Error として throw する
 *
 * @param error - ConnectError オブジェクト
 * @throws JavaScript Error（cause に ConnectError を含む）
 *
 * @example
 * ```typescript
 * const connectError = createConnectError('Connection refused', request);
 * throwConnectError(connectError);
 * ```
 */
export const throwConnectError = (error: ConnectError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * JavaScript Error から ConnectError を抽出する
 *
 * @param error - JavaScript Error
 * @returns 抽出された ConnectError、見つからない場合は null
 *
 * @example
 * ```typescript
 * try {
 *   throwConnectError(createConnectError('Error', request));
 * } catch (error) {
 *   const connectError = extractConnectError(error as Error);
 *   if (connectError) {
 *     console.log(connectError.request.uri);
 *   }
 * }
 * ```
 */
export const extractConnectError = (error: unknown): ConnectError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isConnectError(error.cause)) {
    return error.cause;
  }

  return null;
};
