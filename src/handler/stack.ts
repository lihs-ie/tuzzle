/**
 * ハンドラースタックとミドルウェアチェーン管理
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';
import type { HttpHeaders } from '../message/headers';

const ERROR_NO_HANDLER = 'No handler has been set';

/**
 * マルチパートアイテムの型
 */
export type MultipartItem = {
  readonly name: string;
  readonly contents: string | Blob | ReadableStream<Uint8Array>;
  readonly filename?: string;
  readonly headers?: HttpHeaders;
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
 * Cookie Jar の型（将来実装）
 */
export type CookieJar = Record<string, never>;

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
  readonly headers?: HttpHeaders;

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
export type HandlerStack = {
  readonly handler: Handler | null;
  readonly stack: readonly StackItem[];
};

/**
 * 新しいハンドラースタックを生成する
 *
 * @param handler - デフォルトハンドラー（省略可）
 * @returns 新しいハンドラースタック
 */
export const HandlerStack = (handler?: Handler): HandlerStack => ({
  handler: handler ?? null,
  stack: [],
});

/**
 * ハンドラーを設定した新しいスタックを返す
 *
 * @param stack - 元のスタック
 * @param handler - 設定するハンドラー
 * @returns ハンドラーが設定された新しいスタック
 */
export const setHandler = (stack: HandlerStack, handler: Handler): HandlerStack => ({
  ...stack,
  handler,
});

/**
 * ミドルウェアをスタックの一番上（末尾）に追加する
 *
 * @param stack - 元のスタック
 * @param middleware - 追加するミドルウェア
 * @param name - ミドルウェアの名前
 * @returns ミドルウェアが追加された新しいスタック
 */
export const push = (stack: HandlerStack, middleware: Middleware, name: string): HandlerStack => ({
  ...stack,
  stack: [...stack.stack, { middleware, name }],
});

/**
 * ミドルウェアをスタックの一番下（先頭）に追加する
 *
 * @param stack - 元のスタック
 * @param middleware - 追加するミドルウェア
 * @param name - ミドルウェアの名前
 * @returns ミドルウェアが追加された新しいスタック
 */
export const unshift = (
  stack: HandlerStack,
  middleware: Middleware,
  name: string,
): HandlerStack => ({
  ...stack,
  stack: [{ middleware, name }, ...stack.stack],
});

/**
 * 指定した名前のミドルウェアの前に挿入する
 *
 * @param stack - 元のスタック
 * @param findName - 検索するミドルウェア名
 * @param middleware - 挿入するミドルウェア
 * @param withName - 挿入するミドルウェアの名前
 * @returns ミドルウェアが挿入された新しいスタック。見つからない場合は元のスタック
 */
export const before = (
  stack: HandlerStack,
  findName: string,
  middleware: Middleware,
  withName: string,
): HandlerStack => {
  const index = stack.stack.findIndex((item) => item.name === findName);

  if (index === -1) {
    return stack;
  }

  const newStack = [...stack.stack];
  newStack.splice(index, 0, { middleware, name: withName });

  return {
    ...stack,
    stack: newStack,
  };
};

/**
 * 指定した名前のミドルウェアの後に挿入する
 *
 * @param stack - 元のスタック
 * @param findName - 検索するミドルウェア名
 * @param middleware - 挿入するミドルウェア
 * @param withName - 挿入するミドルウェアの名前
 * @returns ミドルウェアが挿入された新しいスタック。見つからない場合は元のスタック
 */
export const after = (
  stack: HandlerStack,
  findName: string,
  middleware: Middleware,
  withName: string,
): HandlerStack => {
  const index = stack.stack.findIndex((item) => item.name === findName);

  if (index === -1) {
    return stack;
  }

  const newStack = [...stack.stack];
  newStack.splice(index + 1, 0, { middleware, name: withName });

  return {
    ...stack,
    stack: newStack,
  };
};

/**
 * 指定した名前のミドルウェアを削除する
 *
 * @param stack - 元のスタック
 * @param name - 削除するミドルウェアの名前
 * @returns ミドルウェアが削除された新しいスタック。見つからない場合は元のスタック
 */
export const remove = (stack: HandlerStack, name: string): HandlerStack => {
  const newStack = stack.stack.filter((item) => item.name !== name);

  if (newStack.length === stack.stack.length) {
    return stack;
  }

  return {
    ...stack,
    stack: newStack,
  };
};

/**
 * ハンドラーが設定されているかチェックする
 *
 * @param stack - チェック対象のスタック
 * @returns ハンドラーが設定されている場合は true
 */
export const hasHandler = (stack: HandlerStack): boolean => stack.handler !== null;

/**
 * ミドルウェアチェーンを解決して最終的なハンドラー関数を返す
 * スタックを逆順に畳み込み、各ミドルウェアが次のハンドラーをラップする
 *
 * @param stack - 解決するスタック
 * @returns 最終的なハンドラー関数
 * @throws ハンドラーが設定されていない場合
 */
export const resolve = (stack: HandlerStack): Handler => {
  if (!stack.handler) {
    throw new Error(ERROR_NO_HANDLER);
  }

  // スタックを逆順に畳み込み
  // [A, B, C] の場合、C(B(A(handler))) の順でラップされる
  return stack.stack.reduceRight((handler, item) => item.middleware(handler), stack.handler);
};
