/**
 * CookieJar型定義と関数群
 * Cookie の保存・取得・削除を管理します
 */

import type { SetCookie } from './set.js';
import { isExpired, matchesDomain, matchesPath, parseSetCookie, validateSetCookie } from './set.js';
import type { HttpRequest, HttpResponse } from '../message/index.js';
import { withHeader } from '../message/request.js';
import { getHeader as getHeaderFromResponse } from '../message/response.js';

/**
 * CookieJar - Cookieの集合を管理する型
 */
export type CookieJar = {
  readonly cookies: readonly SetCookie[];
  readonly strictMode: boolean;
};

/**
 * 新しいCookieJarを生成します
 *
 * @param options - オプション
 * @param options.strictMode - 無効なCookieを拒否するか（デフォルト: false）
 * @param options.cookies - 初期Cookieリスト（デフォルト: []）
 * @returns CookieJar
 *
 * @example
 * ```typescript
 * const jar = CookieJar();
 * const strictJar = CookieJar({ strictMode: true });
 * ```
 */
export const CookieJar = (options?: {
  strictMode?: boolean;
  cookies?: readonly SetCookie[];
}): CookieJar => ({
  cookies: options?.cookies ?? [],
  strictMode: options?.strictMode ?? false,
});

/**
 * CookieをCookieJarに追加します。同じ name/domain/path のCookieがあれば上書きします
 *
 * @param jar - CookieJar
 * @param cookie - 追加するSetCookie
 * @returns 更新されたCookieJar
 * @throws strictModeでCookieが無効な場合にエラーをスロー
 *
 * @example
 * ```typescript
 * const jar = CookieJar();
 * const cookie: SetCookie = { name: 'sessionId', value: 'abc123', domain: 'example.com', ... };
 * const updatedJar = addCookie(jar, cookie);
 * ```
 */
export const addCookie = (jar: CookieJar, cookie: SetCookie): CookieJar => {
  const validationResult = validateSetCookie(cookie);
  if (validationResult !== true) {
    if (jar.strictMode) {
      throw new Error(`Invalid cookie: ${validationResult}`);
    }
    return removeCookie(jar, cookie.domain, cookie.path, cookie.name);
  }

  const existingIndex = jar.cookies.findIndex(
    (c) => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path,
  );

  if (existingIndex === -1) {
    return {
      ...jar,
      cookies: [...jar.cookies, cookie],
    };
  }

  const newCookies = [...jar.cookies];
  newCookies[existingIndex] = cookie;

  return {
    ...jar,
    cookies: newCookies,
  };
};

/**
 * 指定した条件にマッチするCookieを削除します
 *
 * @param jar - CookieJar
 * @param domain - ドメイン（null の場合はフィルタリングしない）
 * @param path - パス（null の場合はフィルタリングしない）
 * @param name - Cookie名（null の場合はフィルタリングしない）
 * @returns 更新されたCookieJar
 *
 * @example
 * ```typescript
 * const jar = CookieJar({ cookies: [...] });
 * const updatedJar = removeCookie(jar, 'example.com', '/', 'sessionId');
 * ```
 */
export const removeCookie = (
  jar: CookieJar,
  domain: string | null,
  path: string | null,
  name: string | null,
): CookieJar => {
  let filtered = jar.cookies;

  if (domain) {
    filtered = filtered.filter((c) => c.domain !== domain);
  }

  if (path) {
    filtered = filtered.filter((c) => c.path !== path);
  }

  if (name) {
    filtered = filtered.filter((c) => c.name !== name);
  }

  return {
    ...jar,
    cookies: filtered,
  };
};

/**
 * リクエストURIにマッチする有効なCookieを取得します
 *
 * @param jar - CookieJar
 * @param uri - リクエストURI
 * @param isSecure - HTTPSリクエストかどうか
 * @returns マッチするCookieの配列
 *
 * @example
 * ```typescript
 * const jar = CookieJar({ cookies: [...] });
 * const cookies = getCookiesForRequest(jar, 'https://example.com/api', true);
 * ```
 */
export const getCookiesForRequest = (
  jar: CookieJar,
  uri: string,
  isSecure: boolean,
): readonly SetCookie[] => {
  const url = new URL(uri);
  const domain = url.hostname;
  const path = url.pathname || '/';

  return jar.cookies.filter((cookie) => {
    if (isExpired(cookie)) {
      return false;
    }

    if (!matchesDomain(cookie, domain)) {
      return false;
    }

    if (!matchesPath(cookie, path)) {
      return false;
    }

    if (cookie.secure && !isSecure) {
      return false;
    }

    return true;
  });
};

/**
 * レスポンスからSet-Cookieヘッダーを抽出してCookieJarに追加します
 *
 * @param jar - CookieJar
 * @param request - HttpRequest
 * @param response - HttpResponse
 * @returns 更新されたCookieJar
 *
 * @example
 * ```typescript
 * const jar = CookieJar();
 * const updatedJar = extractCookiesFromResponse(jar, request, response);
 * ```
 */
export const extractCookiesFromResponse = (
  jar: CookieJar,
  request: HttpRequest,
  response: HttpResponse,
): CookieJar => {
  const setCookieHeaders = getHeaderFromResponse(response, 'Set-Cookie');

  if (!setCookieHeaders) {
    return jar;
  }

  const headers: readonly string[] = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];

  let updatedJar = jar;

  for (const header of headers) {
    const cookie = parseSetCookie(header);

    if (!cookie.domain) {
      const url = new URL(request.uri);
      updatedJar = addCookie(updatedJar, { ...cookie, domain: url.hostname });
    } else {
      updatedJar = addCookie(updatedJar, cookie);
    }
  }

  return updatedJar;
};

/**
 * リクエストにCookieヘッダーを追加します
 *
 * @param jar - CookieJar
 * @param request - HttpRequest
 * @returns Cookie ヘッダーが追加されたHttpRequest
 *
 * @example
 * ```typescript
 * const jar = CookieJar({ cookies: [...] });
 * const request: HttpRequest = { uri: 'https://example.com/api', ... };
 * const updatedRequest = addCookieHeaderToRequest(jar, request);
 * ```
 */
export const addCookieHeaderToRequest = (jar: CookieJar, request: HttpRequest): HttpRequest => {
  const url = new URL(request.uri);
  const isSecure = url.protocol === 'https:';
  const cookies = getCookiesForRequest(jar, request.uri, isSecure);

  if (cookies.length === 0) {
    return request;
  }

  const cookieHeaderValue = cookies.map((c) => `${c.name}=${c.value ?? ''}`).join('; ');

  return withHeader(request, 'Cookie', cookieHeaderValue);
};
