import { describe, it, expect } from 'vitest';
import {
  HttpRequest,
  withMethod,
  withUri,
  withHeader,
  withoutHeader,
  withBody,
  withVersion,
  getHeader,
  hasHeader,
} from '../../../src/message/request';
import { HttpBodyStream } from '../../../src/message/stream';

describe('HttpRequest', () => {
  it('should create request with minimal parameters', () => {
    const request = HttpRequest('GET', 'https://example.com');

    expect(request.method).toBe('GET');
    expect(request.uri).toBe('https://example.com');
    expect(request.headers).toEqual({});
    expect(request.body).toBeNull();
    expect(request.version).toBe('1.1');
  });

  it('should create request with all options', () => {
    const body = HttpBodyStream('test body');
    const headers = { 'Content-Type': 'application/json' };

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
    const updated = withMethod(original, 'POST');

    expect(updated.method).toBe('POST');
    expect(updated).not.toBe(original);
    expect(original.method).toBe('GET');
  });
});

describe('withUri', () => {
  it('should return new request with updated uri', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = withUri(original, 'https://newsite.com');

    expect(updated.uri).toBe('https://newsite.com');
    expect(updated).not.toBe(original);
    expect(original.uri).toBe('https://example.com');
  });
});

describe('withHeader', () => {
  it('should add new header without mutating original', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = withHeader(original, 'Content-Type', 'application/json');

    expect(updated.headers['Content-Type']).toBe('application/json');
    expect(updated).not.toBe(original);
    expect(original.headers['Content-Type']).toBeUndefined();
  });

  it('should update existing header case-insensitively', () => {
    const original = HttpRequest('GET', 'https://example.com', {
      headers: { 'Content-Type': 'text/plain' },
    });
    const updated = withHeader(original, 'content-type', 'application/json');

    expect(updated.headers['Content-Type']).toBe('application/json');
    expect(Object.keys(updated.headers)).toEqual(['Content-Type']);
  });

  it('should support array values', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = withHeader(original, 'Accept', ['application/json', 'text/html']);

    expect(updated.headers.Accept).toEqual(['application/json', 'text/html']);
  });
});

describe('withoutHeader', () => {
  it('should remove header case-insensitively', () => {
    const original = HttpRequest('GET', 'https://example.com', {
      headers: { 'Content-Type': 'application/json', Accept: 'text/html' },
    });
    const updated = withoutHeader(original, 'content-type');

    expect(updated.headers['Content-Type']).toBeUndefined();
    expect(updated.headers.Accept).toBe('text/html');
    expect(updated).not.toBe(original);
  });

  it('should return same object when header does not exist', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = withoutHeader(original, 'X-Custom');

    expect(updated).toBe(original);
  });
});

describe('withBody', () => {
  it('should update body without mutating original', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const body = HttpBodyStream('new body');
    const updated = withBody(original, body);

    expect(updated.body).toBe(body);
    expect(updated).not.toBe(original);
    expect(original.body).toBeNull();
  });

  it('should allow setting body to null', () => {
    const body = HttpBodyStream('test');
    const original = HttpRequest('POST', 'https://example.com', { body });
    const updated = withBody(original, null);

    expect(updated.body).toBeNull();
  });
});

describe('withVersion', () => {
  it('should update version without mutating original', () => {
    const original = HttpRequest('GET', 'https://example.com');
    const updated = withVersion(original, '2.0');

    expect(updated.version).toBe('2.0');
    expect(updated).not.toBe(original);
    expect(original.version).toBe('1.1');
  });
});

describe('getHeader', () => {
  it('should retrieve header case-insensitively', () => {
    const request = HttpRequest('GET', 'https://example.com', {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(getHeader(request, 'content-type')).toBe('application/json');
    expect(getHeader(request, 'CONTENT-TYPE')).toBe('application/json');
    expect(getHeader(request, 'Content-Type')).toBe('application/json');
  });

  it('should return undefined for missing header', () => {
    const request = HttpRequest('GET', 'https://example.com');
    expect(getHeader(request, 'X-Custom')).toBeUndefined();
  });

  it('should return array values as-is', () => {
    const request = HttpRequest('GET', 'https://example.com', {
      headers: { Accept: ['application/json', 'text/html'] },
    });

    expect(getHeader(request, 'accept')).toEqual(['application/json', 'text/html']);
  });
});

describe('hasHeader', () => {
  it('should check header existence case-insensitively', () => {
    const request = HttpRequest('GET', 'https://example.com', {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(hasHeader(request, 'content-type')).toBe(true);
    expect(hasHeader(request, 'CONTENT-TYPE')).toBe(true);
    expect(hasHeader(request, 'X-Custom')).toBe(false);
  });
});
