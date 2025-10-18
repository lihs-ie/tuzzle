/**
 * HTTP ヘッダーの型定義と操作関数
 */

const HEADER_KEY_SEPARATOR = '-';
const HEADER_VALUE_DELIMITER = ',';

export type HeaderValue = string | readonly string[];

/**
 * HTTP ヘッダーの型
 * キーは文字列、値は文字列または文字列の配列
 */
export interface HttpHeaders {
  readonly data: Readonly<Record<string, HeaderValue>>;
  readonly set: (key: string, value: HeaderValue) => HttpHeaders;
  readonly remove: (key: string) => HttpHeaders;
  readonly get: (key: string) => HeaderValue | undefined;
  readonly has: (key: string) => boolean;
  readonly merge: (...additional: HttpHeaders[]) => HttpHeaders;
  readonly toRecord: () => Readonly<Record<string, HeaderValue>>;
}

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

const cloneHeaders = (
  headers: Readonly<Record<string, HeaderValue>>,
): Record<string, HeaderValue> => {
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

/**
 * 新しいHttpHeadersオブジェクトを生成する
 *
 * @param data - 初期ヘッダーデータ（省略可）
 * @returns 新しいHttpHeadersオブジェクト
 *
 * @example
 * ```typescript
 * const headers = HttpHeaders({ 'Content-Type': 'application/json' });
 * const updated = headers.set('Authorization', 'Bearer token');
 * ```
 */
export const HttpHeaders = (data?: Readonly<Record<string, HeaderValue>>): HttpHeaders => {
  const normalizedData = data ? cloneHeaders(data) : {};

  return {
    data: normalizedData,

    set(key: string, value: HeaderValue): HttpHeaders {
      const normalizedKey = normalizeHeaderKey(key);
      const next = cloneHeaders(this.data);
      next[normalizedKey] = cloneHeaderValue(value);
      return HttpHeaders(next);
    },

    remove(key: string): HttpHeaders {
      const normalizedKey = normalizeHeaderKey(key);
      let hasRemoval = false;
      const next: Record<string, HeaderValue> = {};

      for (const [currentKey, currentValue] of Object.entries(this.data)) {
        if (normalizeHeaderKey(currentKey) === normalizedKey) {
          hasRemoval = true;
          continue;
        }
        next[normalizeHeaderKey(currentKey)] = cloneHeaderValue(currentValue);
      }

      return hasRemoval ? HttpHeaders(next) : this;
    },

    get(key: string): HeaderValue | undefined {
      const normalizedKey = normalizeHeaderKey(key);

      for (const [currentKey, value] of Object.entries(this.data)) {
        if (normalizeHeaderKey(currentKey) === normalizedKey) {
          return value;
        }
      }

      return undefined;
    },

    has(key: string): boolean {
      return this.get(key) !== undefined;
    },

    merge(...additional: HttpHeaders[]): HttpHeaders {
      const merged = cloneHeaders(this.data);

      for (const headers of additional) {
        for (const [key, value] of Object.entries(headers.data)) {
          merged[normalizeHeaderKey(key)] = cloneHeaderValue(value);
        }
      }

      return HttpHeaders(merged);
    },

    toRecord(): Readonly<Record<string, HeaderValue>> {
      return this.data;
    },
  };
};
