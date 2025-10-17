/**
 * HTTP ヘッダーの型定義と操作関数
 */

const HEADER_KEY_SEPARATOR = '-';
const HEADER_VALUE_DELIMITER = ',';

type HeaderValue = string | readonly string[];

/**
 * HTTP ヘッダーの型
 * キーは文字列、値は文字列または文字列の配列
 */
export type HttpHeaders = Readonly<Record<string, HeaderValue>>;

const cloneHeaderValue = (value: HeaderValue): HeaderValue => {
  if (typeof value === 'string') {
    return value;
  }
  // value is readonly string[]
  const cloned: string[] = [];
  for (const item of value) {
    cloned.push(item);
  }
  return cloned;
};

const cloneHeaders = (headers: HttpHeaders): Record<string, HeaderValue> => {
  const clone: Record<string, HeaderValue> = {};

  for (const [key, value] of Object.entries(headers)) {
    clone[normalizeHeaderKey(key)] = cloneHeaderValue(value);
  }

  return clone;
};

/**
 * ヘッダーキーを正規化する
 * 例: "content-type" → "Content-Type"
 *
 * @param key - 正規化するヘッダーキー
 * @returns Title-Case形式に正規化されたヘッダーキー
 */
export const normalizeHeaderKey = (key: string): string =>
  key
    .toLowerCase()
    .split(HEADER_KEY_SEPARATOR)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(HEADER_KEY_SEPARATOR);

/**
 * ヘッダーを追加または更新した新しいヘッダーオブジェクトを返す
 *
 * @param headers - 元となるヘッダー
 * @param key - 追加または更新するヘッダーキー
 * @param value - 設定するヘッダー値
 * @returns 新しいヘッダーオブジェクト
 */
export const setHeader = (headers: HttpHeaders, key: string, value: HeaderValue): HttpHeaders => {
  const normalizedKey = normalizeHeaderKey(key);
  const next = cloneHeaders(headers);
  next[normalizedKey] = cloneHeaderValue(value);
  return next;
};

/**
 * 指定したヘッダーキーを削除する
 *
 * @param headers - 元となるヘッダー
 * @param key - 削除したいヘッダーキー
 * @returns 指定キーを取り除いたヘッダーオブジェクト。キーが存在しない場合は元のヘッダー
 */
export const removeHeader = (headers: HttpHeaders, key: string): HttpHeaders => {
  const normalizedKey = normalizeHeaderKey(key);
  let hasRemoval = false;
  const next: Record<string, HeaderValue> = {};

  for (const [currentKey, value] of Object.entries(headers)) {
    if (normalizeHeaderKey(currentKey) === normalizedKey) {
      hasRemoval = true;
      continue;
    }
    next[normalizeHeaderKey(currentKey)] = cloneHeaderValue(value);
  }

  return hasRemoval ? (next as HttpHeaders) : headers;
};

/**
 * 指定したヘッダーキーの値を取得する
 *
 * @param headers - 検索対象のヘッダー
 * @param key - 取得したいヘッダーキー
 * @returns 見つかった値。存在しない場合は undefined
 */
export const getHeader = (headers: HttpHeaders, key: string): HeaderValue | undefined => {
  const normalizedKey = normalizeHeaderKey(key);

  for (const [currentKey, value] of Object.entries(headers)) {
    if (normalizeHeaderKey(currentKey) === normalizedKey) {
      return value;
    }
  }

  return undefined;
};

/**
 * ヘッダーの存在を確認する
 *
 * @param headers - 検査対象のヘッダー
 * @param key - 存在確認したいヘッダーキー
 * @returns 指定したヘッダーが存在する場合は true
 */
export const hasHeader = (headers: HttpHeaders, key: string): boolean =>
  getHeader(headers, key) !== undefined;

/**
 * 複数のヘッダーをマージする
 * 後勝ちで上書きされる
 *
 * @param base - 基本ヘッダー
 * @param additional - マージする追加ヘッダー
 * @returns マージ後の新しいヘッダー
 */
export const mergeHeaders = (base: HttpHeaders, ...additional: HttpHeaders[]): HttpHeaders => {
  const merged = cloneHeaders(base);

  for (const headers of additional) {
    for (const [key, value] of Object.entries(headers)) {
      merged[normalizeHeaderKey(key)] = cloneHeaderValue(value);
    }
  }

  return merged;
};

/**
 * カンマ区切りのヘッダー値を配列に変換する
 *
 * @param value - 解析対象のヘッダー値
 * @returns 個々の値を格納した配列
 */
export const parseHeaderValue = (value: string): readonly string[] => {
  if (value.trim().length === 0) {
    return [];
  }

  return value
    .split(HEADER_VALUE_DELIMITER)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
};
