import { describe, it, expect } from 'vitest';
import { normalizeHeaderKey, parseHeaderValue, HttpHeaders } from '../../../src/message/headers';

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

describe('HttpHeaders.set', () => {
  it('should add new header without mutating original headers', () => {
    const original = HttpHeaders();
    const updated = original.set('content-type', 'application/json');

    expect(updated).not.toBe(original);
    expect(updated.data['Content-Type']).toBe('application/json');
    expect(original.data['Content-Type']).toBeUndefined();
  });

  it('should override existing header regardless of case', () => {
    const headers = HttpHeaders({ 'Content-Type': 'text/plain' });
    const updated = headers.set('content-type', 'application/json');

    expect(updated.data['Content-Type']).toBe('application/json');
    expect(Object.keys(updated.data)).toEqual(['Content-Type']);
  });

  it('should clone array values to preserve immutability', () => {
    const values = ['a', 'b'] as const;
    const headers = HttpHeaders();
    const updated = headers.set('x-values', values);

    const stored = updated.get('x-values');
    expect(stored).toEqual(['a', 'b']);
    expect(stored).not.toBe(values);
  });
});

describe('HttpHeaders.remove', () => {
  it('should remove header ignoring case', () => {
    const headers = HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
    const updated = headers.remove('content-type');

    expect(updated.data['Content-Type']).toBeUndefined();
    expect(updated.data.Accept).toBe('application/json');
  });

  it('should return original headers when key does not exist', () => {
    const headers = HttpHeaders({ Accept: 'application/json' });
    const updated = headers.remove('content-type');

    expect(updated).toEqual(headers);
  });
});

describe('HttpHeaders.get / HttpHeaders.has', () => {
  it('should retrieve header value ignoring case', () => {
    const headers = HttpHeaders({ 'Content-Type': 'application/json' });

    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.has('CONTENT-TYPE')).toBe(true);
  });

  it('should return undefined for missing headers', () => {
    const headers = HttpHeaders();

    expect(headers.get('content-type')).toBeUndefined();
    expect(headers.has('content-type')).toBe(false);
  });
});

describe('HttpHeaders.merge', () => {
  it('should merge multiple header objects with later values taking precedence', () => {
    const base = HttpHeaders({ Accept: 'application/json' });
    const merged = base.merge(
      HttpHeaders({ 'Content-Type': 'text/plain' }),
      HttpHeaders({ 'content-type': 'application/json' }),
    );

    expect(merged.data.Accept).toBe('application/json');
    expect(merged.data['Content-Type']).toBe('application/json');
  });

  it('should not mutate input headers', () => {
    const base = HttpHeaders({ Accept: 'application/json' });
    const additional = HttpHeaders({ 'X-Test': 'value' });
    const merged = base.merge(additional);

    expect(merged).not.toBe(base);
    expect(merged).not.toBe(additional);
    expect(merged.data.Accept).toBe('application/json');
    expect(merged.data['X-Test']).toBe('value');
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
