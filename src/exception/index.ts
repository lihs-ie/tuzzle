/**
 * Exception モジュール
 * tuzzle の例外階層とエラーハンドリング機能を提供します
 */

// TuzzleError（基底エラー型）
export type { TuzzleError } from './tuzzle.js';
export {
  createTuzzleError,
  isTuzzleError,
  throwTuzzleError,
  extractTuzzleError,
} from './tuzzle.js';

// TransferError（転送エラー）
export type { TransferError } from './transfer.js';
export {
  createTransferError,
  isTransferError,
  throwTransferError,
  extractTransferError,
} from './transfer.js';

// ConnectError（接続エラー）
export type { ConnectError } from './connect.js';
export {
  createConnectError,
  isConnectError,
  throwConnectError,
  extractConnectError,
} from './connect.js';

// RequestError（リクエストエラー）
export type { RequestError } from './request.js';
export {
  createRequestError,
  isRequestError,
  throwRequestError,
  extractRequestError,
} from './request.js';

// BadResponseError（4xx/5xx 基底）
export type { BadResponseError } from './bad-response.js';
export {
  createBadResponseError,
  isBadResponseError,
  throwBadResponseError,
  extractBadResponseError,
} from './bad-response.js';

// ClientError（4xx エラー）
export type { ClientError } from './client.js';
export {
  createClientError,
  isClientError,
  throwClientError,
  extractClientError,
} from './client.js';

// ServerError（5xx エラー）
export type { ServerError } from './server.js';
export {
  createServerError,
  isServerError,
  throwServerError,
  extractServerError,
} from './server.js';

// TooManyRedirectsError（リダイレクト過多）
export type { TooManyRedirectsError } from './too-many-redirects.js';
export {
  createTooManyRedirectsError,
  isTooManyRedirectsError,
  throwTooManyRedirectsError,
  extractTooManyRedirectsError,
} from './too-many-redirects.js';

// エラーメッセージフォーマッター
export { formatErrorMessage, summarizeBody, summarizeBodyStream } from './formatter.js';
