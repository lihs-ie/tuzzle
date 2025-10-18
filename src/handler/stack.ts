/**
 * ハンドラースタックとミドルウェアチェーン管理
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';
import type { HeaderValue } from '../message/headers';
import type { CookieJar } from '../cookie/jar.js';

const ERROR_NO_HANDLER = 'No handler has been set';

/**
 * マルチパートアイテムの型
 */
export type MultipartItem = {
  readonly name: string;
  readonly contents: string | Blob | ReadableStream<Uint8Array>;
  readonly filename?: string;
  readonly headers?: Readonly<Record<string, HeaderValue>>;
};

/**
 * 転送統計情報の型
 */
export type TransferStats = {
  readonly request: HttpRequest;
  readonly response: HttpResponse | null;
  readonly transferTime: number;
  readonly error: Error | null;
};

/**
 * リダイレクト詳細設定の型
 */
export type RedirectConfig = {
  readonly max: number;
  readonly strict: boolean;
  readonly referer: boolean;
  readonly protocols: readonly string[];
  readonly onRedirect?: (previous: string, next: string) => void;
};

/**
 * プロキシ詳細設定の型
 */
export type ProxyConfig = {
  readonly http?: string;
  readonly https?: string;
  readonly no?: readonly string[];
};

/**
 * リクエストオプションの型
 * Guzzle RequestOptions に相当する完全な型定義
 */
export type RequestOptions = {
  /** リダイレクト設定 */
  readonly allowRedirects?: boolean | RedirectConfig;

  /** 認証情報 [username, password, type] */
  readonly auth?: readonly [string, string, 'basic' | 'digest' | 'ntlm'];

  /** リクエストボディ */
  readonly body?: string | Blob | ReadableStream<Uint8Array> | null;

  /** SSL証明書 */
  readonly cert?: string | readonly [string, string];

  /** Cookie管理 */
  readonly cookies?: CookieJar | boolean;

  /** 接続タイムアウト（ミリ秒） */
  readonly connectTimeout?: number;

  /** リクエストタイムアウト（ミリ秒） */
  readonly timeout?: number;

  /** 読み取りタイムアウト（ミリ秒） */
  readonly readTimeout?: number;

  /** 暗号化方式 */
  readonly cryptoMethod?: string;

  /** デバッグ出力 */
  readonly debug?: boolean | NodeJS.WriteStream;

  /** コンテンツデコード */
  readonly decodeContent?: boolean | string;

  /** 遅延（ミリ秒） */
  readonly delay?: number;

  /** Expectヘッダー */
  readonly expect?: boolean | number;

  /** IP解決の強制 */
  readonly forceIpResolve?: 'v4' | 'v6';

  /** フォームパラメータ（application/x-www-form-urlencoded） */
  readonly formParams?: Record<string, string>;

  /** HTTPヘッダー */
  readonly headers?: Readonly<Record<string, HeaderValue>>;

  /** HTTPエラー例外化 */
  readonly httpErrors?: boolean;

  /** IDN変換 */
  readonly idnConversion?: boolean | number;

  /** JSONボディ（application/json） */
  readonly json?: unknown;

  /** マルチパートデータ */
  readonly multipart?: readonly MultipartItem[];

  /** ヘッダー受信時のコールバック */
  readonly onHeaders?: (response: HttpResponse) => void;

  /** 転送統計のコールバック */
  readonly onStats?: (stats: TransferStats) => void;

  /** 進捗コールバック */
  readonly progress?: (
    downloadTotal: number,
    downloadNow: number,
    uploadTotal: number,
    uploadNow: number,
  ) => void;

  /** プロキシ設定 */
  readonly proxy?: string | ProxyConfig;

  /** クエリパラメータ */
  readonly query?: Record<string, string> | string;

  /** 出力先 */
  readonly sink?: string | NodeJS.WriteStream;

  /** SSLキー */
  readonly sslKey?: string | readonly [string, string];

  /** ストリームモード */
  readonly stream?: boolean;

  /** 同期フラグ */
  readonly synchronous?: boolean;

  /** SSL検証 */
  readonly verify?: boolean | string;

  /** HTTPバージョン */
  readonly version?: '1.0' | '1.1' | '2.0' | '3.0';
};

/**
 * ハンドラー関数の型
 * HTTPリクエストを受け取り、レスポンスを返す
 */
export type Handler = (request: HttpRequest, options: RequestOptions) => Promise<HttpResponse>;

/**
 * ミドルウェア関数の型
 * ハンドラーをラップして新しいハンドラーを返す
 */
export type Middleware = (next: Handler) => Handler;

/**
 * ミドルウェアスタックアイテム
 */
export type StackItem = {
  readonly middleware: Middleware;
  readonly name: string;
};

/**
 * ハンドラースタック
 */
export interface HandlerStack {
  readonly handler: Handler | null;
  readonly stack: readonly StackItem[];

  // メソッドスタイル
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
 * 新しいハンドラースタックを生成する
 *
 * @param handler - デフォルトハンドラー（省略可）
 * @returns 新しいハンドラースタック
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
