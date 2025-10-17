import { describe, it, expect } from 'vitest';
import {
  CookieJar,
  addCookie,
  removeCookie,
  getCookiesForRequest,
} from '../../../src/cookie/jar.js';
import type { SetCookie } from '../../../src/cookie/set.js';

describe('CookieJar', () => {
  it('should create empty CookieJar', () => {
    const jar = CookieJar();
    expect(jar.cookies).toEqual([]);
    expect(jar.strictMode).toBe(false);
  });

  it('should create CookieJar with initial cookies', () => {
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
    const jar = CookieJar({ cookies: [cookie] });
    expect(jar.cookies).toHaveLength(1);
    expect(jar.cookies[0]).toEqual(cookie);
  });

  it('should create CookieJar with strict mode', () => {
    const jar = CookieJar({ strictMode: true });
    expect(jar.strictMode).toBe(true);
  });
});

describe('addCookie', () => {
  it('should add cookie to empty jar', () => {
    const jar = CookieJar();
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
    const updatedJar = addCookie(jar, cookie);
    expect(updatedJar.cookies).toHaveLength(1);
    expect(updatedJar.cookies[0]).toEqual(cookie);
  });

  it('should overwrite existing cookie with same name/domain/path', () => {
    const cookie1: SetCookie = {
      name: 'sessionId',
      value: 'old-value',
      domain: 'example.com',
      path: '/',
      maxAge: null,
      expires: null,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    const jar = CookieJar({ cookies: [cookie1] });

    const cookie2: SetCookie = {
      ...cookie1,
      value: 'new-value',
    };
    const updatedJar = addCookie(jar, cookie2);

    expect(updatedJar.cookies).toHaveLength(1);
    expect(updatedJar.cookies[0]?.value).toBe('new-value');
  });

  it('should throw error for invalid cookie in strict mode', () => {
    const jar = CookieJar({ strictMode: true });
    const invalidCookie: SetCookie = {
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
    expect(() => addCookie(jar, invalidCookie)).toThrow();
  });
});

describe('removeCookie', () => {
  it('should remove cookie by name', () => {
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
    const jar = CookieJar({ cookies: [cookie] });
    const updatedJar = removeCookie(jar, null, null, 'sessionId');
    expect(updatedJar.cookies).toHaveLength(0);
  });

  it('should remove cookie by domain', () => {
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
    const jar = CookieJar({ cookies: [cookie] });
    const updatedJar = removeCookie(jar, 'example.com', null, null);
    expect(updatedJar.cookies).toHaveLength(0);
  });
});

describe('getCookiesForRequest', () => {
  it('should return cookies matching domain and path', () => {
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
    const jar = CookieJar({ cookies: [cookie] });
    const cookies = getCookiesForRequest(jar, 'https://example.com/api', true);
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toEqual(cookie);
  });

  it('should not return expired cookies', () => {
    const expiredCookie: SetCookie = {
      name: 'sessionId',
      value: 'abc123',
      domain: 'example.com',
      path: '/',
      maxAge: null,
      expires: Date.now() - 1000,
      secure: false,
      httpOnly: false,
      discard: false,
    };
    const jar = CookieJar({ cookies: [expiredCookie] });
    const cookies = getCookiesForRequest(jar, 'https://example.com/', true);
    expect(cookies).toHaveLength(0);
  });

  it('should not return secure cookies for HTTP requests', () => {
    const secureCookie: SetCookie = {
      name: 'sessionId',
      value: 'abc123',
      domain: 'example.com',
      path: '/',
      maxAge: null,
      expires: null,
      secure: true,
      httpOnly: false,
      discard: false,
    };
    const jar = CookieJar({ cookies: [secureCookie] });
    const cookies = getCookiesForRequest(jar, 'http://example.com/', false);
    expect(cookies).toHaveLength(0);
  });
});
