/**
 * Handler stack and middleware chain management
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';
import type { HeaderValue } from '../message/headers';
import type { CookieJar } from '../cookie/jar.js';

const ERROR_NO_HANDLER = 'No handler has been set';

/**
 * Multipart item type
 */
export type MultipartItem = {
  readonly name: string;
  readonly contents: string | Blob | ReadableStream<Uint8Array>;
  readonly filename?: string;
  readonly headers?: Readonly<Record<string, HeaderValue>>;
};

/**
 * Transfer statistics information type
 */
export type TransferStats = {
  readonly request: HttpRequest;
  readonly response: HttpResponse | null;
  readonly transferTime: number;
  readonly error: Error | null;
};

/**
 * Redirect detailed configuration type
 */
export type RedirectConfig = {
  readonly max: number;
  readonly strict: boolean;
  readonly referer: boolean;
  readonly protocols: readonly string[];
  readonly onRedirect?: (previous: string, next: string) => void;
};

/**
 * Proxy detailed configuration type
 */
export type ProxyConfig = {
  readonly http?: string;
  readonly https?: string;
  readonly no?: readonly string[];
};

/**
 * Request options type
 * Complete type definition corresponding to Guzzle RequestOptions
 */
export type RequestOptions = {
  /** Redirect configuration */
  readonly allowRedirects?: boolean | RedirectConfig;

  /** Authentication credentials [username, password, type] */
  readonly auth?: readonly [string, string, 'basic' | 'digest' | 'ntlm'];

  /** Request body */
  readonly body?: string | Blob | ReadableStream<Uint8Array> | null;

  /** SSL certificate */
  readonly cert?: string | readonly [string, string];

  /** Cookie management */
  readonly cookies?: CookieJar | boolean;

  /** Connection timeout (milliseconds) */
  readonly connectTimeout?: number;

  /** Request timeout (milliseconds) */
  readonly timeout?: number;

  /** Read timeout (milliseconds) */
  readonly readTimeout?: number;

  /** Encryption method */
  readonly cryptoMethod?: string;

  /** Debug output */
  readonly debug?: boolean | NodeJS.WriteStream;

  /** Content decoding */
  readonly decodeContent?: boolean | string;

  /** Delay (milliseconds) */
  readonly delay?: number;

  /** Expect header */
  readonly expect?: boolean | number;

  /** Force IP resolution */
  readonly forceIpResolve?: 'v4' | 'v6';

  /** Form parameters (application/x-www-form-urlencoded) */
  readonly formParams?: Record<string, string>;

  /** HTTP headers */
  readonly headers?: Readonly<Record<string, HeaderValue>>;

  /** HTTP error exception */
  readonly httpErrors?: boolean;

  /** IDN conversion */
  readonly idnConversion?: boolean | number;

  /** JSON body (application/json) */
  readonly json?: unknown;

  /** Multipart data */
  readonly multipart?: readonly MultipartItem[];

  /** Callback on headers received */
  readonly onHeaders?: (response: HttpResponse) => void;

  /** Transfer statistics callback */
  readonly onStats?: (stats: TransferStats) => void;

  /** Progress callback */
  readonly progress?: (
    downloadTotal: number,
    downloadNow: number,
    uploadTotal: number,
    uploadNow: number,
  ) => void;

  /** Proxy configuration */
  readonly proxy?: string | ProxyConfig;

  /** Query parameters */
  readonly query?: Record<string, string> | string;

  /** Output destination */
  readonly sink?: string | NodeJS.WriteStream;

  /** SSL key */
  readonly sslKey?: string | readonly [string, string];

  /** Stream mode */
  readonly stream?: boolean;

  /** Synchronous flag */
  readonly synchronous?: boolean;

  /** SSL verification */
  readonly verify?: boolean | string;

  /** HTTP version */
  readonly version?: '1.0' | '1.1' | '2.0' | '3.0';
};

/**
 * Handler function type
 * Receives an HTTP request and returns a response
 */
export type Handler = (request: HttpRequest, options: RequestOptions) => Promise<HttpResponse>;

/**
 * Middleware function type
 * Wraps a handler and returns a new handler
 */
export type Middleware = (next: Handler) => Handler;

/**
 * Middleware stack item
 */
export type StackItem = {
  readonly middleware: Middleware;
  readonly name: string;
};

/**
 * Handler stack
 */
export interface HandlerStack {
  readonly handler: Handler | null;
  readonly stack: readonly StackItem[];

  // Method style
  readonly setHandler: (handler: Handler) => HandlerStack;
  readonly push: (middleware: Middleware, name: string) => HandlerStack;
  readonly unshift: (middleware: Middleware, name: string) => HandlerStack;
  readonly before: (findName: string, middleware: Middleware, withName: string) => HandlerStack;
  readonly after: (findName: string, middleware: Middleware, withName: string) => HandlerStack;
  readonly remove: (name: string) => HandlerStack;
  readonly hasHandler: () => boolean;
  readonly resolve: () => Handler;
}

/**
 * Creates a new handler stack
 *
 * @param handler - Default handler (optional)
 * @returns New handler stack
 */
export const HandlerStack = (handler?: Handler): HandlerStack => ({
  handler: handler ?? null,
  stack: [],

  setHandler(newHandler: Handler): HandlerStack {
    return HandlerStack(newHandler);
  },

  push(middleware: Middleware, name: string): HandlerStack {
    const newStack = HandlerStack(this.handler ?? undefined);
    return {
      ...newStack,
      stack: [...this.stack, { middleware, name }],
    };
  },

  unshift(middleware: Middleware, name: string): HandlerStack {
    const newStack = HandlerStack(this.handler ?? undefined);
    return {
      ...newStack,
      stack: [{ middleware, name }, ...this.stack],
    };
  },

  before(findName: string, middleware: Middleware, withName: string): HandlerStack {
    const index = this.stack.findIndex((item) => item.name === findName);
    if (index === -1) {
      return this;
    }
    const newStackArray = [...this.stack];
    newStackArray.splice(index, 0, { middleware, name: withName });
    const newStack = HandlerStack(this.handler ?? undefined);
    return {
      ...newStack,
      stack: newStackArray,
    };
  },

  after(findName: string, middleware: Middleware, withName: string): HandlerStack {
    const index = this.stack.findIndex((item) => item.name === findName);
    if (index === -1) {
      return this;
    }
    const newStackArray = [...this.stack];
    newStackArray.splice(index + 1, 0, { middleware, name: withName });
    const newStack = HandlerStack(this.handler ?? undefined);
    return {
      ...newStack,
      stack: newStackArray,
    };
  },

  remove(name: string): HandlerStack {
    const newStackArray = this.stack.filter((item) => item.name !== name);
    if (newStackArray.length === this.stack.length) {
      return this;
    }
    const newStack = HandlerStack(this.handler ?? undefined);
    return {
      ...newStack,
      stack: newStackArray,
    };
  },

  hasHandler(): boolean {
    return this.handler !== null;
  },

  resolve(): Handler {
    if (!this.handler) {
      throw new Error(ERROR_NO_HANDLER);
    }
    return this.stack.reduceRight((handler, item) => item.middleware(handler), this.handler);
  },
});
