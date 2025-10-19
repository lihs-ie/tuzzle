/**
 * Cookie management module
 * RFC 6265 compliant SetCookie parser and CookieJar
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

export { CookieJar } from './jar.js';
