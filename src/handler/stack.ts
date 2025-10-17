/**
 * ハンドラースタックとミドルウェアチェーン管理
 */

import type { HttpRequest } from '../message/request';
import type { HttpResponse } from '../message/response';

const ERROR_NO_HANDLER = 'No handler has been set';

/**
 * リクエストオプションの型（簡易版）
 * チケット#04で詳細実装予定
 */
export type RequestOptions = Record<string, unknown>;

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
