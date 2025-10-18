/**
 * TuzzleError - tuzzle の基底エラー型
 * すべての tuzzle エラーの基底となる型です
 */

/**
 * TuzzleError 型定義
 * オブジェクトベースのエラー表現（クラスではない）
 */
export type TuzzleError = {
  readonly type: 'TuzzleError';
  readonly message: string;
  readonly cause?: Error;
  readonly stack?: string;
};

/**
 * TuzzleError を作成する
 *
 * @param message - エラーメッセージ
 * @param options - オプション（cause, stack）
 * @returns TuzzleError オブジェクト
 *
 * @example
 * ```typescript
 * const error = createTuzzleError('Something went wrong');
 * const errorWithCause = createTuzzleError('Failed to fetch', { cause: originalError });
 * ```
 */
export const createTuzzleError = (
  message: string,
  options?: { cause?: Error; stack?: string },
): TuzzleError => {
  // スタックトレースの生成
  const stack = options?.stack ?? new Error().stack;

  return {
    type: 'TuzzleError',
    message,
    cause: options?.cause,
    stack,
  };
};

/**
 * 値が TuzzleError かどうかを判定する型ガード
 *
 * @param value - 判定対象の値
 * @returns TuzzleError の場合は true
 *
 * @example
 * ```typescript
 * if (isTuzzleError(error)) {
 *   console.log(error.message);
 * }
 * ```
 */
export const isTuzzleError = (value: unknown): value is TuzzleError => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return obj.type === 'TuzzleError' && typeof obj.message === 'string';
};

/**
 * TuzzleError を JavaScript の Error として throw する
 * throw/catch 構文で使用するための変換関数
 *
 * @param error - TuzzleError オブジェクト
 * @throws JavaScript Error（cause に TuzzleError を含む）
 *
 * @example
 * ```typescript
 * const tuzzleError = createTuzzleError('Something went wrong');
 * throwTuzzleError(tuzzleError);
 * ```
 */
export const throwTuzzleError = (error: TuzzleError): never => {
  const jsError = new Error(error.message, { cause: error });
  if (error.stack) {
    jsError.stack = error.stack;
  }
  throw jsError;
};

/**
 * JavaScript Error から TuzzleError を抽出する
 * throw された Error の cause から元の TuzzleError を取得
 *
 * @param error - JavaScript Error
 * @returns 抽出された TuzzleError、見つからない場合は null
 *
 * @example
 * ```typescript
 * try {
 *   throwTuzzleError(createTuzzleError('Error'));
 * } catch (error) {
 *   const tuzzleError = extractTuzzleError(error as Error);
 *   if (tuzzleError) {
 *     console.log(tuzzleError.message);
 *   }
 * }
 * ```
 */
export const extractTuzzleError = (error: unknown): TuzzleError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  if (isTuzzleError(error.cause)) {
    return error.cause;
  }

  return null;
};
