/**
 * tuzzle - Type-safe HTTP client for TypeScript inspired by Guzzle
 * @packageDocumentation
 */

// Core client
export { HttpClient } from './client';
export type { ClientConfig } from './client';

// HTTP methods
export { Method } from './method';
export type { Method as HttpMethod } from './method';

// Message types (PSR-7 equivalent)
export { HttpRequest } from './message/request';
export { HttpResponse } from './message/response';
export { HttpHeaders } from './message/headers';
export type { HttpHeaders as HttpHeadersType, HeaderValue } from './message/headers';
export { normalizeHeaderKey, parseHeaderValue } from './message/headers';
export { HttpBodyStream } from './message/stream';

// Handler and middleware
export { HandlerStack } from './handler/stack';
export { FetchHandler } from './handler/fetch';
export type { Handler, Middleware, TransferStats, RequestOptions } from './handler/stack';

// Cookies
export { CookieJar } from './cookie/jar';
export { parseSetCookie } from './cookie/set';

// Exceptions (re-export from exception/index.ts)
export type {
  TuzzleError,
  TransferError,
  ConnectError,
  RequestError,
  BadResponseError,
  ClientError,
  ServerError,
  TooManyRedirectsError,
} from './exception';

export {
  throwError,
  createTuzzleError,
  isTuzzleError,
  extractTuzzleError,
  createTransferError,
  isTransferError,
  extractTransferError,
  createConnectError,
  isConnectError,
  extractConnectError,
  createRequestError,
  isRequestError,
  extractRequestError,
  createBadResponseError,
  isBadResponseError,
  extractBadResponseError,
  createClientError,
  isClientError,
  extractClientError,
  createServerError,
  isServerError,
  extractServerError,
  createTooManyRedirectsError,
  isTooManyRedirectsError,
  extractTooManyRedirectsError,
  formatErrorMessage,
  summarizeBody,
  summarizeBodyStream,
} from './exception';
