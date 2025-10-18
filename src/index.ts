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

// Exceptions
export type { TuzzleError } from './exception/tuzzle.js';
export {
  createTuzzleError,
  isTuzzleError,
  throwTuzzleError,
  extractTuzzleError,
} from './exception/tuzzle.js';

export type { RequestError } from './exception/request.js';
export {
  createRequestError,
  isRequestError,
  throwRequestError,
  extractRequestError,
} from './exception/request.js';

export type { ConnectError } from './exception/connect.js';
export {
  createConnectError,
  isConnectError,
  throwConnectError,
  extractConnectError,
} from './exception/connect.js';

export type { ClientError } from './exception/client.js';
export {
  createClientError,
  isClientError,
  throwClientError,
  extractClientError,
} from './exception/client.js';

export type { ServerError } from './exception/server.js';
export {
  createServerError,
  isServerError,
  throwServerError,
  extractServerError,
} from './exception/server.js';

export type { TransferError } from './exception/transfer.js';
export {
  createTransferError,
  isTransferError,
  throwTransferError,
  extractTransferError,
} from './exception/transfer.js';
