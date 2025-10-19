/**
 * HTTP request type definitions and operation functions
 */

import type { Method } from '../method';
import type { HttpBodyStream } from './stream';
import { HttpHeaders } from './headers';
import type { HttpHeaders as HttpHeadersType } from './headers';

const DEFAULT_HTTP_VERSION = '1.1';

/**
 * HTTP request type
 */
export interface HttpRequest {
  readonly method: Method;
  readonly uri: string;
  readonly headers: HttpHeadersType;
  readonly body: HttpBodyStream | null;
  readonly version: string;

  // Method-style operations
  readonly withMethod: (method: Method) => HttpRequest;
  readonly withUri: (uri: string) => HttpRequest;
  readonly withHeader: (key: string, value: string | readonly string[]) => HttpRequest;
  readonly withoutHeader: (key: string) => HttpRequest;
  readonly withBody: (body: HttpBodyStream | null) => HttpRequest;
  readonly withVersion: (version: string) => HttpRequest;
  readonly getHeader: (key: string) => string | readonly string[] | undefined;
  readonly hasHeader: (key: string) => boolean;
}

/**
 * Creates a new HTTP request
 *
 * @param method - HTTP method
 * @param uri - Request URI
 * @param options - Optional settings (headers, body, version)
 * @returns A new HttpRequest object
 */
export const HttpRequest = (
  method: Method,
  uri: string,
  options?: Partial<
    Omit<
      HttpRequest,
      | 'method'
      | 'uri'
      | 'withMethod'
      | 'withUri'
      | 'withHeader'
      | 'withoutHeader'
      | 'withBody'
      | 'withVersion'
      | 'getHeader'
      | 'hasHeader'
    >
  >,
): HttpRequest => ({
  method,
  uri,
  headers: options?.headers ?? HttpHeaders(),
  body: options?.body ?? null,
  version: options?.version ?? DEFAULT_HTTP_VERSION,

  withMethod(newMethod: Method): HttpRequest {
    return HttpRequest(newMethod, this.uri, {
      headers: this.headers,
      body: this.body,
      version: this.version,
    });
  },

  withUri(newUri: string): HttpRequest {
    return HttpRequest(this.method, newUri, {
      headers: this.headers,
      body: this.body,
      version: this.version,
    });
  },

  withHeader(key: string, value: string | readonly string[]): HttpRequest {
    return HttpRequest(this.method, this.uri, {
      headers: this.headers.set(key, value),
      body: this.body,
      version: this.version,
    });
  },

  withoutHeader(key: string): HttpRequest {
    const newHeaders = this.headers.remove(key);
    if (newHeaders === this.headers) {
      return this;
    }
    return HttpRequest(this.method, this.uri, {
      headers: newHeaders,
      body: this.body,
      version: this.version,
    });
  },

  withBody(newBody: HttpBodyStream | null): HttpRequest {
    return HttpRequest(this.method, this.uri, {
      headers: this.headers,
      body: newBody,
      version: this.version,
    });
  },

  withVersion(newVersion: string): HttpRequest {
    return HttpRequest(this.method, this.uri, {
      headers: this.headers,
      body: this.body,
      version: newVersion,
    });
  },

  getHeader(key: string): string | readonly string[] | undefined {
    return this.headers.get(key);
  },

  hasHeader(key: string): boolean {
    return this.headers.has(key);
  },
});
