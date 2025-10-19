/**
 * Message module
 * Provides PSR-7 equivalent HTTP message types and operation functions
 */

// Headers
export { HttpHeaders } from './headers';
export type { HttpHeaders as HttpHeadersType, HeaderValue } from './headers';
export { normalizeHeaderKey, parseHeaderValue } from './headers';

// Stream
export type { HttpBodyStream } from './stream';
export {
  HttpBodyStream as createHttpBodyStream,
  streamToString,
  getSize,
  isReadable,
} from './stream';

// Request
export type { HttpRequest } from './request';
export { HttpRequest as createHttpRequest } from './request';

// Response
export type { HttpResponse } from './response';
export { HttpResponse as createHttpResponse } from './response';
