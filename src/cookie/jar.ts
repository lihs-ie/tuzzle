/**
 * CookieJar type definitions and functions
 * Manages storage, retrieval, and deletion of cookies
 */

import type { SetCookie } from './set.js';
import { isExpired, matchesDomain, matchesPath, parseSetCookie, validateSetCookie } from './set.js';
import type { HttpRequest, HttpResponse } from '../message/index.js';

/**
 * CookieJar - Type for managing a collection of cookies
 */
export interface CookieJar {
  readonly cookies: readonly SetCookie[];
  readonly strictMode: boolean;
  readonly add: (cookie: SetCookie) => CookieJar;
  readonly remove: (domain: string | null, path: string | null, name: string | null) => CookieJar;
  readonly getForRequest: (uri: string, isSecure: boolean) => readonly SetCookie[];
  readonly extractFromResponse: (request: HttpRequest, response: HttpResponse) => CookieJar;
  readonly addCookieHeaderToRequest: (request: HttpRequest) => HttpRequest;
}

/**
 * Creates a new CookieJar
 *
 * @param options - Options
 * @param options.strictMode - Whether to reject invalid cookies (default: false)
 * @param options.cookies - Initial cookie list (default: [])
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
  add(cookie: SetCookie): CookieJar {
    const validationResult = validateSetCookie(cookie);
    if (validationResult !== true) {
      if (this.strictMode) {
        throw new Error(`Invalid cookie: ${validationResult}`);
      }
      return this.remove(cookie.domain, cookie.path, cookie.name);
    }

    const existingIndex = this.cookies.findIndex(
      (c) => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path,
    );

    if (existingIndex === -1) {
      return {
        ...this,
        cookies: [...this.cookies, cookie],
      };
    }

    const newCookies = [...this.cookies];
    newCookies[existingIndex] = cookie;

    return {
      ...this,
      cookies: newCookies,
    };
  },
  remove(domain: string | null, path: string | null, name: string | null): CookieJar {
    let filtered = this.cookies;

    if (domain) {
      filtered = filtered.filter((cookie) => cookie.domain !== domain);
    }

    if (path) {
      filtered = filtered.filter((cookie) => cookie.path !== path);
    }

    if (name) {
      filtered = filtered.filter((cookie) => cookie.name !== name);
    }

    return {
      ...this,
      cookies: filtered,
    };
  },
  getForRequest(uri: string, isSecure: boolean): readonly SetCookie[] {
    const url = new URL(uri);
    const domain = url.hostname;
    const path = url.pathname || '/';

    return this.cookies.filter((cookie) => {
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
  },
  extractFromResponse(request: HttpRequest, response: HttpResponse): CookieJar {
    const setCookieHeaders = response.getHeader('Set-Cookie');

    if (!setCookieHeaders) {
      return this;
    }

    const headers: readonly string[] = Array.isArray(setCookieHeaders)
      ? setCookieHeaders
      : [setCookieHeaders];

    let updatedJar = Object.assign({}, this);

    for (const header of headers) {
      const cookie = parseSetCookie(header);

      if (!cookie.domain) {
        const url = new URL(request.uri);
        updatedJar = this.add({ ...cookie, domain: url.hostname });
      } else {
        updatedJar = this.add(cookie);
      }
    }

    return updatedJar;
  },
  addCookieHeaderToRequest(request: HttpRequest): HttpRequest {
    const url = new URL(request.uri);
    const isSecure = url.protocol === 'https:';
    const cookies = this.getForRequest(request.uri, isSecure);

    if (cookies.length === 0) {
      return request;
    }

    const cookieHeaderValue = cookies.map((c) => `${c.name}=${c.value ?? ''}`).join('; ');

    return request.withHeader('Cookie', cookieHeaderValue);
  },
});
