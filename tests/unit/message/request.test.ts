import { describe, it, expect } from 'vitest';
import { HttpRequest } from '../../../src/message/request';
import { HttpBodyStream } from '../../../src/message/stream';
import { HttpHeaders } from '../../../src/message/headers';

describe('HttpRequest', () => {
  it('should create request with minimal parameters', () => {
    const request = HttpRequest('GET', 'https://example.com');

    expect(request.method).toBe('GET');
    expect(request.uri).toBe('https://example.com');
    expect(request.headers.data).toEqual({});
    expect(request.body).toBeNull();
    expect(request.version).toBe('1.1');
  });

  it('should create request with all options', () => {
    const body = HttpBodyStream('test body');
    const headers = HttpHeaders({ 'Content-Type': 'application/json' });

    const request = HttpRequest('POST', 'https://api.example.com', {
      headers,
      body,
      version: '2.0',
    });

    expect(request.method).toBe('POST');
    expect(request.uri).toBe('https://api.example.com');
    expect(request.headers).toEqual(headers);
    expect(request.body).toBe(body);
    expect(request.version).toBe('2.0');
  });
});

describe('withMethod', () => {
  it('should return new request with updated method', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = original.withMethod('POST');

    expect(updated.method).toBe('POST');
    expect(updated).not.toBe(original);
    expect(original.method).toBe('GET');
  });
});

describe('withUri', () => {
  it('should return new request with updated uri', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = original.withUri('https://newsite.com');

    expect(updated.uri).toBe('https://newsite.com');
    expect(updated).not.toBe(original);
    expect(original.uri).toBe('https://example.com');
  });
});

describe('withHeader', () => {
  it('should add new header without mutating original', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = original.withHeader('Content-Type', 'application/json');

    expect(updated.headers.get('Content-Type')).toBe('application/json');
    expect(updated).not.toBe(original);
    expect(original.headers.get('Content-Type')).toBeUndefined();
  });

  it('should update existing header case-insensitively', () => {
    const original = HttpRequest('GET', 'https://example.com', {
      headers: HttpHeaders({ 'Content-Type': 'text/plain' }),
    });
    const updated = original.withHeader('content-type', 'application/json');

    expect(updated.headers.get('Content-Type')).toBe('application/json');
    expect(Object.keys(updated.headers.data)).toEqual(['Content-Type']);
  });

  it('should support array values', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = original.withHeader('Accept', ['application/json', 'text/html']);

    expect(updated.headers.get('Accept')).toEqual(['application/json', 'text/html']);
  });
});

describe('withoutHeader', () => {
  it('should remove header case-insensitively', () => {
    const original = HttpRequest('GET', 'https://example.com', {
      headers: HttpHeaders({ 'Content-Type': 'application/json', Accept: 'text/html' }),
    });
    const updated = original.withoutHeader('content-type');

    expect(updated.headers.get('Content-Type')).toBeUndefined();
    expect(updated.headers.get('Accept')).toBe('text/html');
    expect(updated).not.toBe(original);
  });

  it('should return same object when header does not exist', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = original.withoutHeader('X-Custom');

    expect(updated).toBe(original);
  });
});

describe('withBody', () => {
  it('should update body without mutating original', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const body = HttpBodyStream('new body');
    const updated = original.withBody(body);

    expect(updated.body).toBe(body);
    expect(updated).not.toBe(original);
    expect(original.body).toBeNull();
  });

  it('should allow setting body to null', () => {
    const body = HttpBodyStream('test');
    const original = HttpRequest('POST', 'https://example.com', { body });
    const updated = original.withBody(null);

    expect(updated.body).toBeNull();
  });
});

describe('withVersion', () => {
  it('should update version without mutating original', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = original.withVersion('2.0');

    expect(updated.version).toBe('2.0');
    expect(updated).not.toBe(original);
    expect(original.version).toBe('1.1');
  });
});

describe('getHeader', () => {
  it('should retrieve header case-insensitively', () => {
    const request = HttpRequest('GET', 'https://example.com', {
      headers: HttpHeaders({ 'Content-Type': 'application/json' }),
    });

    expect(request.getHeader('content-type')).toBe('application/json');
    expect(request.getHeader('CONTENT-TYPE')).toBe('application/json');
    expect(request.getHeader('Content-Type')).toBe('application/json');
  });

  it('should return undefined for missing header', () => {
    const request = HttpRequest('GET', 'https://example.com');
    expect(request.getHeader('X-Custom')).toBeUndefined();
  });

  it('should return array values as-is', () => {
    const request = HttpRequest('GET', 'https://example.com', {
      headers: HttpHeaders({ Accept: ['application/json', 'text/html'] }),
    });

    expect(request.getHeader('accept')).toEqual(['application/json', 'text/html']);
  });
});

describe('hasHeader', () => {
  it('should check header existence case-insensitively', () => {
    const request = HttpRequest('GET', 'https://example.com', {
      headers: HttpHeaders({ 'Content-Type': 'application/json' }),
    });

    expect(request.hasHeader('content-type')).toBe(true);
    expect(request.hasHeader('CONTENT-TYPE')).toBe(true);
    expect(request.hasHeader('X-Custom')).toBe(false);
  });
});
