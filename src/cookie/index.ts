/**
 * Cookie管理モジュール
 * RFC 6265準拠のSetCookieパーサーとCookieJar
 */

export type { SetCookie } from './set.js';
export {
  parseSetCookie,
  serializeSetCookie,
  matchesDomain,
  matchesPath,
  isExpired,
  validateSetCookie,
} from './set.js';

export type { CookieJar } from './jar.js';
export {
  CookieJar as createCookieJar,
  addCookie,
  removeCookie,
  getCookiesForRequest,
  extractCookiesFromResponse,
  addCookieHeaderToRequest,
} from './jar.js';
