/**
 * メッセージモジュール
 * PSR-7相当のHTTPメッセージ型と操作関数を提供
 */

// Headers
export type { HttpHeaders } from './headers';
export {
  normalizeHeaderKey,
  setHeader,
  removeHeader,
  getHeader,
  hasHeader,
  mergeHeaders,
  parseHeaderValue,
} from './headers';

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
export {
  HttpRequest as createHttpRequest,
  withMethod,
  withUri,
  withHeader as withRequestHeader,
  withoutHeader as withoutRequestHeader,
  withBody as withRequestBody,
  withVersion as withRequestVersion,
  getHeader as getRequestHeader,
  hasHeader as hasRequestHeader,
} from './request';

// Response
export type { HttpResponse } from './response';
export {
  HttpResponse as createHttpResponse,
  withStatus,
  withHeader as withResponseHeader,
  withoutHeader as withoutResponseHeader,
  withBody as withResponseBody,
  withVersion as withResponseVersion,
  getHeader as getResponseHeader,
  hasHeader as hasResponseHeader,
  getHeaderLine,
} from './response';
