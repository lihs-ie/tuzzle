import { describe, it, expect } from 'vitest';
import {
  normalizeHeaderKey,
  setHeader,
  removeHeader,
  getHeader,
  hasHeader,
  mergeHeaders,
  parseHeaderValue,
  type HttpHeaders,
} from '../../../src/message/headers';

describe('normalizeHeaderKey', () => {
  it('should normalize header key to Title-Case format', () => {
    expect(normalizeHeaderKey('content-type')).toBe('Content-Type');
    expect(normalizeHeaderKey('CONTENT-TYPE')).toBe('Content-Type');
    expect(normalizeHeaderKey('CoNtEnT-tYpE')).toBe('Content-Type');
  });

  it('should handle single word headers', () => {
    expect(normalizeHeaderKey('host')).toBe('Host');
    expect(normalizeHeaderKey('HOST')).toBe('Host');
  });

  it('should handle multi-hyphen headers', () => {
    expect(normalizeHeaderKey('x-custom-header-name')).toBe('X-Custom-Header-Name');
  });

  it('should handle headers with numbers', () => {
    expect(normalizeHeaderKey('content-md5')).toBe('Content-Md5');
  });
});

describe('setHeader', () => {
  it('should add new header without mutating original headers', () => {
    const original: HttpHeaders = {};
    const updated = setHeader(original, 'content-type', 'application/json');

    expect(updated).not.toBe(original);
    expect(updated['Content-Type']).toBe('application/json');
    expect(original['Content-Type']).toBeUndefined();
  });

  it('should override existing header regardless of case', () => {
    const headers: HttpHeaders = { 'Content-Type': 'text/plain' };
    const updated = setHeader(headers, 'content-type', 'application/json');

    expect(updated['Content-Type']).toBe('application/json');
    expect(Object.keys(updated)).toEqual(['Content-Type']);
  });

  it('should clone array values to preserve immutability', () => {
    const values = ['a', 'b'] as const;
    const headers: HttpHeaders = {};
    const updated = setHeader(headers, 'x-values', values);

    const stored = getHeader(updated, 'x-values');
    expect(stored).toEqual(['a', 'b']);
    expect(stored).not.toBe(values);
  });
});

describe('removeHeader', () => {
  it('should remove header ignoring case', () => {
    const headers: HttpHeaders = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const updated = removeHeader(headers, 'content-type');

    expect(updated['Content-Type']).toBeUndefined();
    expect(updated.Accept).toBe('application/json');
  });

  it('should return original headers when key does not exist', () => {
    const headers: HttpHeaders = { Accept: 'application/json' };
    const updated = removeHeader(headers, 'content-type');

    expect(updated).toEqual(headers);
  });
});

describe('getHeader / hasHeader', () => {
  it('should retrieve header value ignoring case', () => {
    const headers: HttpHeaders = { 'Content-Type': 'application/json' };

    expect(getHeader(headers, 'content-type')).toBe('application/json');
    expect(hasHeader(headers, 'CONTENT-TYPE')).toBe(true);
  });

  it('should return undefined for missing headers', () => {
    const headers: HttpHeaders = {};

    expect(getHeader(headers, 'content-type')).toBeUndefined();
    expect(hasHeader(headers, 'content-type')).toBe(false);
  });
});

describe('mergeHeaders', () => {
  it('should merge multiple header objects with later values taking precedence', () => {
    const base: HttpHeaders = { Accept: 'application/json' };
    const merged = mergeHeaders(
      base,
      { 'Content-Type': 'text/plain' },
      { 'content-type': 'application/json' },
    );

    expect(merged.Accept).toBe('application/json');
    expect(merged['Content-Type']).toBe('application/json');
  });

  it('should not mutate input headers', () => {
    const base: HttpHeaders = { Accept: 'application/json' };
    const additional: HttpHeaders = { 'X-Test': 'value' };
    const merged = mergeHeaders(base, additional);

    expect(merged).not.toBe(base);
    expect(merged).not.toBe(additional);
    expect(merged.Accept).toBe('application/json');
    expect(merged['X-Test']).toBe('value');
  });
});

describe('parseHeaderValue', () => {
  it('should split comma separated values trimming whitespace', () => {
    expect(parseHeaderValue('a, b ,c')).toEqual(['a', 'b', 'c']);
  });

  it('should return single value array when no comma exists', () => {
    expect(parseHeaderValue('application/json')).toEqual(['application/json']);
  });

  it('should handle empty string gracefully', () => {
    expect(parseHeaderValue('')).toEqual([]);
  });
});
