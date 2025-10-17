/**
 * SetCookie型定義とパーサー関数群
 * RFC 6265準拠のCookie処理を提供します
 */

/**
 * SetCookie - Cookie情報を保持する型
 */
export type SetCookie = {
  readonly name: string;
  readonly value: string | null;
  readonly domain: string | null;
  readonly path: string;
  readonly maxAge: number | null;
  readonly expires: number | null;
  readonly secure: boolean;
  readonly httpOnly: boolean;
  readonly discard: boolean;
};

const COOKIE_NAME_VALUE_PATTERN = /^([^=]+)=(.*)$/;
const COOKIE_ATTRIBUTE_PATTERN = /^([^=]+)(?:=(.*))?$/;

/**
 * RFC 6265で定義されている無効なCookie名文字
 * 制御文字(\x00-\x1F, \x7F)、スペース(\x20)、特殊文字(", (, ), ,, /, :, ;, <, =, >, ?, @, [, \, ], {, })
 */
const INVALID_COOKIE_NAME_CHARS_STRING =
  '\u0000-\u0020\u0022\u0028-\u0029\u002c\u002f\u003a-\u0040\u005c\u007b\u007d\u007f';
const INVALID_COOKIE_NAME_CHARS = new RegExp(`[${INVALID_COOKIE_NAME_CHARS_STRING}]`);

/**
 * Set-Cookieヘッダー文字列をパースしてSetCookieオブジェクトを生成します
 *
 * @param setCookieHeader - Set-Cookieヘッダー文字列
 * @returns パースされたSetCookieオブジェクト
 *
 * @example
 * ```typescript
 * const cookie = parseSetCookie('sessionId=abc123; Domain=example.com; Path=/; Secure');
 * console.log(cookie.name); // 'sessionId'
 * console.log(cookie.secure); // true
 * ```
 */
export const parseSetCookie = (setCookieHeader: string): SetCookie => {
  const DEFAULT_SET_COOKIE: SetCookie = {
    name: '',
    value: null,
    domain: null,
    path: '/',
    maxAge: null,
    expires: null,
    secure: false,
    httpOnly: false,
    discard: false,
  };

  const pieces = setCookieHeader
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (pieces.length === 0) {
    return DEFAULT_SET_COOKIE;
  }

  const firstMatch = pieces[0]?.match(COOKIE_NAME_VALUE_PATTERN);
  if (!firstMatch) {
    return DEFAULT_SET_COOKIE;
  }

  let result: SetCookie = {
    ...DEFAULT_SET_COOKIE,
    name: firstMatch[1]?.trim() ?? '',
    value: firstMatch[2]?.trim() ?? '',
  };

  for (let i = 1; i < pieces.length; i++) {
    const piece = pieces[i];
    if (!piece) continue;

    const match = piece.match(COOKIE_ATTRIBUTE_PATTERN);
    if (!match) {
      continue;
    }

    const attrName = (match[1] ?? '').toLowerCase();
    const attrValue = match[2];

    switch (attrName) {
      case 'domain':
        result = { ...result, domain: attrValue ?? null };
        break;
      case 'path':
        result = { ...result, path: attrValue ?? '/' };
        break;
      case 'max-age': {
        const maxAge = attrValue ? parseInt(attrValue, 10) : null;
        result = { ...result, maxAge };
        if (maxAge !== null) {
          result = { ...result, expires: Date.now() + maxAge * 1000 };
        }
        break;
      }
      case 'expires': {
        const expiresDate = attrValue ? new Date(attrValue).getTime() : null;
        result = { ...result, expires: expiresDate };
        break;
      }
      case 'secure':
        result = { ...result, secure: true };
        break;
      case 'httponly':
        result = { ...result, httpOnly: true };
        break;
      default:
        break;
    }
  }

  return result;
};

/**
 * SetCookieオブジェクトをSet-Cookieヘッダー文字列にシリアライズします
 *
 * @param cookie - SetCookieオブジェクト
 * @returns Set-Cookieヘッダー文字列
 *
 * @example
 * ```typescript
 * const cookie: SetCookie = {
 *   name: 'sessionId',
 *   value: 'abc123',
 *   domain: 'example.com',
 *   path: '/',
 *   maxAge: 3600,
 *   expires: null,
 *   secure: true,
 *   httpOnly: true,
 *   discard: false,
 * };
 * const header = serializeSetCookie(cookie);
 * // 'sessionId=abc123; Domain=example.com; Path=/; Max-Age=3600; Secure; HttpOnly'
 * ```
 */
export const serializeSetCookie = (cookie: SetCookie): string => {
  const parts: string[] = [`${cookie.name}=${cookie.value ?? ''}`];

  if (cookie.domain) {
    parts.push(`Domain=${cookie.domain}`);
  }

  if (cookie.path) {
    parts.push(`Path=${cookie.path}`);
  }

  if (cookie.maxAge !== null) {
    parts.push(`Max-Age=${cookie.maxAge}`);
  }

  if (cookie.expires !== null) {
    const expiresDate = new Date(cookie.expires);
    parts.push(`Expires=${expiresDate.toUTCString()}`);
  }

  if (cookie.secure) {
    parts.push('Secure');
  }

  if (cookie.httpOnly) {
    parts.push('HttpOnly');
  }

  return parts.join('; ');
};

/**
 * Cookieのドメインがリクエストドメインにマッチするか判定します（RFC 6265 Section 5.1.3準拠）
 *
 * @param cookie - SetCookieオブジェクト
 * @param requestDomain - リクエストドメイン
 * @returns マッチする場合はtrue
 *
 * @example
 * ```typescript
 * const cookie: SetCookie = { name: 'test', value: 'value', domain: 'example.com', ... };
 * matchesDomain(cookie, 'example.com'); // true
 * matchesDomain(cookie, 'sub.example.com'); // true
 * matchesDomain(cookie, 'different.com'); // false
 * ```
 */
export const matchesDomain = (cookie: SetCookie, requestDomain: string): boolean => {
  const cookieDomain = cookie.domain;

  if (!cookieDomain) {
    return true;
  }

  const normalizedCookieDomain = cookieDomain.replace(/^\./, '').toLowerCase();
  const normalizedRequestDomain = requestDomain.toLowerCase();

  if (normalizedCookieDomain === normalizedRequestDomain) {
    return true;
  }

  const IP_ADDRESS_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (IP_ADDRESS_PATTERN.test(normalizedRequestDomain)) {
    return false;
  }

  return normalizedRequestDomain.endsWith(`.${normalizedCookieDomain}`);
};

/**
 * Cookieのパスがリクエストパスにマッチするか判定します（RFC 6265 Section 5.1.4準拠）
 *
 * @param cookie - SetCookieオブジェクト
 * @param requestPath - リクエストパス
 * @returns マッチする場合はtrue
 *
 * @example
 * ```typescript
 * const cookie: SetCookie = { name: 'test', value: 'value', path: '/api', ... };
 * matchesPath(cookie, '/api'); // true
 * matchesPath(cookie, '/api/users'); // true
 * matchesPath(cookie, '/admin'); // false
 * ```
 */
export const matchesPath = (cookie: SetCookie, requestPath: string): boolean => {
  const cookiePath = cookie.path;

  if (cookiePath === '/' || cookiePath === requestPath) {
    return true;
  }

  if (!requestPath.startsWith(cookiePath)) {
    return false;
  }

  if (cookiePath.endsWith('/')) {
    return true;
  }

  const nextChar = requestPath[cookiePath.length];
  return nextChar === '/';
};

/**
 * Cookieが有効期限切れか判定します
 *
 * @param cookie - SetCookieオブジェクト
 * @returns 有効期限切れの場合はtrue
 *
 * @example
 * ```typescript
 * const cookie: SetCookie = { name: 'test', value: 'value', expires: Date.now() - 1000, ... };
 * isExpired(cookie); // true
 * ```
 */
export const isExpired = (cookie: SetCookie): boolean => {
  if (cookie.expires === null) {
    return false;
  }

  return Date.now() > cookie.expires;
};

/**
 * CookieがRFC 6265に準拠しているか検証します
 *
 * @param cookie - SetCookieオブジェクト
 * @returns 有効な場合はtrue、無効な場合はエラーメッセージ
 *
 * @example
 * ```typescript
 * const cookie: SetCookie = { name: '', value: 'value', domain: 'example.com', ... };
 * validateSetCookie(cookie); // 'The cookie name must not be empty'
 * ```
 */
export const validateSetCookie = (cookie: SetCookie): true | string => {
  if (cookie.name === '') {
    return 'The cookie name must not be empty';
  }

  if (INVALID_COOKIE_NAME_CHARS.test(cookie.name)) {
    return 'Cookie name must not contain invalid characters';
  }

  if (cookie.value === null) {
    return 'The cookie value must not be empty';
  }

  if (!cookie.domain || cookie.domain === '') {
    return 'The cookie domain must not be empty';
  }

  return true;
};
