/**
 * Exception module
 * Provides tuzzle's exception hierarchy and error handling functionality
 */

// TuzzleError (base error type)
export type { TuzzleError } from './tuzzle.js';
export {
  createTuzzleError,
  isTuzzleError,
  throwTuzzleError,
  extractTuzzleError,
} from './tuzzle.js';

// TransferError (transfer error)
export type { TransferError } from './transfer.js';
export {
  createTransferError,
  isTransferError,
  throwTransferError,
  extractTransferError,
} from './transfer.js';

// ConnectError (connection error)
export type { ConnectError } from './connect.js';
export {
  createConnectError,
  isConnectError,
  throwConnectError,
  extractConnectError,
} from './connect.js';

// RequestError (request error)
export type { RequestError } from './request.js';
export {
  createRequestError,
  isRequestError,
  throwRequestError,
  extractRequestError,
} from './request.js';

// BadResponseError (4xx/5xx base)
export type { BadResponseError } from './bad-response.js';
export {
  createBadResponseError,
  isBadResponseError,
  throwBadResponseError,
  extractBadResponseError,
} from './bad-response.js';

// ClientError (4xx error)
export type { ClientError } from './client.js';
export {
  createClientError,
  isClientError,
  throwClientError,
  extractClientError,
} from './client.js';

// ServerError (5xx error)
export type { ServerError } from './server.js';
export {
  createServerError,
  isServerError,
  throwServerError,
  extractServerError,
} from './server.js';

// TooManyRedirectsError (too many redirects)
export type { TooManyRedirectsError } from './too-many-redirects.js';
export {
  createTooManyRedirectsError,
  isTooManyRedirectsError,
  throwTooManyRedirectsError,
  extractTooManyRedirectsError,
} from './too-many-redirects.js';

// Error message formatter
export { formatErrorMessage, summarizeBody, summarizeBodyStream } from './formatter.js';
