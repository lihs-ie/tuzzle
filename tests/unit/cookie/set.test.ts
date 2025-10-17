import { describe, it, expect } from 'vitest';
import {
  parseSetCookie,
  serializeSetCookie,
  matchesDomain,
  matchesPath,
  isExpired,
  validateSetCookie,
} from '../../../src/cookie/set.js';
import type { SetCookie } from '../../../src/cookie/set.js';

describe('parseSetCookie', () => {
  it('should parse basic name-value pair', () => {
    const result = parseSetCookie('sessionId=abc123');
    expect(result.name).toBe('sessionId');
    expect(result.value).toBe('abc123');
  });

  it('should parse Set-Cookie with all attributes', () => {
    const result = parseSetCookie(
      'sessionId=abc123; Domain=example.com; Path=/api; Max-Age=3600; Secure; HttpOnly',
    );
    expect(result.name).toBe('sessionId');
    expect(result.value).toBe('abc123');
    expect(result.domain).toBe('example.com');
    expect(result.path).toBe('/api');
    expect(result.maxAge).toBe(3600);
    expect(result.secure).toBe(true);
    expect(result.httpOnly).toBe(true);
  });

  it('should auto-calculate expires from Max-Age', () => {
    const before = Date.now();
    const MAX_AGE_SECONDS = 3600;
    const result = parseSetCookie(`test=value; Max-Age=${MAX_AGE_SECONDS}`);
    const after = Date.now();

    expect(result.maxAge).toBe(MAX_AGE_SECONDS);
    expect(result.expires).not.toBeNull();
    if (result.expires !== null) {
      expect(result.expires).toBeGreaterThanOrEqual(before + MAX_AGE_SECONDS * 1000);
      expect(result.expires).toBeLessThanOrEqual(after + MAX_AGE_SECONDS * 1000);
    }
  });
});

describe('serializeSetCookie', () => {
  it('should serialize basic name-value pair', () => {
    const cookie: SetCookie = {
      name: 'sessionId',
      value: 'abc123',
      domain: null,
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    const result = serializeSetCookie(cookie);
    expect(result).toBe('sessionId=abc123; Path=/');
  });
});

describe('matchesDomain', () => {
  it('should match when domain is null', () => {
    const cookie: SetCookie = {
      name: 'test',
      value: 'value',
      domain: null,
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    expect(matchesDomain(cookie, 'example.com')).toBe(true);
  });

  it('should match exact domain', () => {
    const cookie: SetCookie = {
      name: 'test',
      value: 'value',
      domain: 'example.com',
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    expect(matchesDomain(cookie, 'example.com')).toBe(true);
  });
});

describe('matchesPath', () => {
  it('should match root path', () => {
    const cookie: SetCookie = {
      name: 'test',
      value: 'value',
      domain: null,
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    expect(matchesPath(cookie, '/')).toBe(true);
    expect(matchesPath(cookie, '/api')).toBe(true);
  });
});

describe('isExpired', () => {
  it('should return false for session cookies (expires is null)', () => {
    const cookie: SetCookie = {
      name: 'test',
      value: 'value',
      domain: null,
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    expect(isExpired(cookie)).toBe(false);
  });

  it('should return true for past expiration', () => {
    const pastExpires = Date.now() - 3600 * 1000;
    const cookie: SetCookie = {
      name: 'test',
      value: 'value',
      domain: null,
      path: '/',
      maxAge: null,
      expires: pastExpires,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    expect(isExpired(cookie)).toBe(true);
  });
});

describe('validateSetCookie', () => {
  it('should return true for valid cookie', () => {
    const cookie: SetCookie = {
      name: 'sessionId',
      value: 'abc123',
      domain: 'example.com',
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    expect(validateSetCookie(cookie)).toBe(true);
  });

  it('should return error for empty name', () => {
    const cookie: SetCookie = {
      name: '',
      value: 'value',
      domain: 'example.com',
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    expect(validateSetCookie(cookie)).toBe('The cookie name must not be empty');
  });
});
