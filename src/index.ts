/**
 * tuzzle - Type-safe HTTP client for TypeScript inspired by Guzzle
 * @packageDocumentation
 */

// Core client
export { HttpClient } from './client.js';
export type { ClientConfig } from './client.js';

// HTTP methods
export { Method } from './method.js';
export type { Method as HttpMethod } from './method.js';

// Message types (PSR-7 equivalent)
export { HttpRequest } from './message/request.js';
export { HttpResponse } from './message/response.js';
export { HttpHeaders } from './message/headers.js';
export type { HttpHeaders as HttpHeadersType, HeaderValue } from './message/headers.js';
export { normalizeHeaderKey, parseHeaderValue } from './message/headers.js';
export { HttpBodyStream } from './message/stream.js';

// Handler and middleware
export { HandlerStack } from './handler/stack.js';
export { FetchHandler } from './handler/fetch.js';
export type { Handler, Middleware, TransferStats, RequestOptions } from './handler/stack.js';

// Cookies
export { CookieJar } from './cookie/jar.js';
export { parseSetCookie } from './cookie/set.js';

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
} from './exception/index.js';

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
} from './exception/index.js';
