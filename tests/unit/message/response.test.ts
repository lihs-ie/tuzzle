import { describe, it, expect } from 'vitest';
import {
  HttpResponse,
  withStatus,
  withHeader,
  withoutHeader,
  withBody,
  withVersion,
  getHeader,
  hasHeader,
  getHeaderLine,
} from '../../../src/message/response';
import { HttpBodyStream } from '../../../src/message/stream';

describe('HttpResponse', () => {
  it('should create response with minimal parameters', () => {
    const response = HttpResponse(200);

    expect(response.statusCode).toBe(200);
    expect(response.reasonPhrase).toBe('OK');
    expect(response.headers).toEqual({});
    expect(response.body).toBeNull();
    expect(response.version).toBe('1.1');
  });

  it('should create response with all options', () => {
    const body = HttpBodyStream('response body');
    const headers = { 'Content-Type': 'application/json' };

    const response = HttpResponse(201, {
      reasonPhrase: 'Created',
      headers,
      body,
      version: '2.0',
    });

    expect(response.statusCode).toBe(201);
    expect(response.reasonPhrase).toBe('Created');
    expect(response.headers).toEqual(headers);
    expect(response.body).toBe(body);
    expect(response.version).toBe('2.0');
  });

  it('should use default reason phrase for common status codes', () => {
    expect(HttpResponse(200).reasonPhrase).toBe('OK');
    expect(HttpResponse(201).reasonPhrase).toBe('Created');
    expect(HttpResponse(400).reasonPhrase).toBe('Bad Request');
    expect(HttpResponse(404).reasonPhrase).toBe('Not Found');
    expect(HttpResponse(500).reasonPhrase).toBe('Internal Server Error');
  });
});

describe('withStatus', () => {
  it('should update status code and derive reason phrase', () => {
    const original = HttpResponse(200);
    const updated = withStatus(original, 404);

    expect(updated.statusCode).toBe(404);
    expect(updated.reasonPhrase).toBe('Not Found');
    expect(updated).not.toBe(original);
  });

  it('should allow custom reason phrase', () => {
    const original = HttpResponse(200);
    const updated = withStatus(original, 418, 'I am a teapot');

    expect(updated.statusCode).toBe(418);
    expect(updated.reasonPhrase).toBe('I am a teapot');
  });

  it('should use empty reason phrase for unknown status codes', () => {
    const original = HttpResponse(200);
    const updated = withStatus(original, 999);

    expect(updated.statusCode).toBe(999);
    expect(updated.reasonPhrase).toBe('');
  });
});

describe('withHeader', () => {
  it('should add new header without mutating original', () => {
    const original = HttpResponse(200);
    const updated = withHeader(original, 'Content-Type', 'application/json');

    expect(updated.headers['Content-Type']).toBe('application/json');
    expect(updated).not.toBe(original);
    expect(original.headers['Content-Type']).toBeUndefined();
  });

  it('should update existing header case-insensitively', () => {
    const original = HttpResponse(200, {
      headers: { 'Content-Type': 'text/plain' },
    });
    const updated = withHeader(original, 'content-type', 'application/json');

    expect(updated.headers['Content-Type']).toBe('application/json');
    expect(Object.keys(updated.headers)).toEqual(['Content-Type']);
  });

  it('should support array values', () => {
    const original = HttpResponse(200);
    const updated = withHeader(original, 'Set-Cookie', ['a=1', 'b=2']);

    expect(updated.headers['Set-Cookie']).toEqual(['a=1', 'b=2']);
  });
});

describe('withoutHeader', () => {
  it('should remove header case-insensitively', () => {
    const original = HttpResponse(200, {
      headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
    });
    const updated = withoutHeader(original, 'content-type');

    expect(updated.headers['Content-Type']).toBeUndefined();
    expect(updated.headers['X-Custom']).toBe('value');
    expect(updated).not.toBe(original);
  });

  it('should return same object when header does not exist', () => {
    const original = HttpResponse(200);
    const updated = withoutHeader(original, 'X-Custom');

    expect(updated).toBe(original);
  });
});

describe('withBody', () => {
  it('should update body without mutating original', () => {
    const original = HttpResponse(200);
    const body = HttpBodyStream('new body');
    const updated = withBody(original, body);

    expect(updated.body).toBe(body);
    expect(updated).not.toBe(original);
    expect(original.body).toBeNull();
  });

  it('should allow setting body to null', () => {
    const body = HttpBodyStream('test');
    const original = HttpResponse(200, { body });
    const updated = withBody(original, null);

    expect(updated.body).toBeNull();
  });
});

describe('withVersion', () => {
  it('should update version without mutating original', () => {
    const original = HttpResponse(200);
    const updated = withVersion(original, '2.0');

    expect(updated.version).toBe('2.0');
    expect(updated).not.toBe(original);
    expect(original.version).toBe('1.1');
  });
});

describe('getHeader', () => {
  it('should retrieve header case-insensitively', () => {
    const response = HttpResponse(200, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(getHeader(response, 'content-type')).toBe('application/json');
    expect(getHeader(response, 'CONTENT-TYPE')).toBe('application/json');
    expect(getHeader(response, 'Content-Type')).toBe('application/json');
  });

  it('should return undefined for missing header', () => {
    const response = HttpResponse(200);
    expect(getHeader(response, 'X-Custom')).toBeUndefined();
  });

  it('should return array values as-is', () => {
    const response = HttpResponse(200, {
      headers: { 'Set-Cookie': ['a=1', 'b=2'] },
    });

    expect(getHeader(response, 'set-cookie')).toEqual(['a=1', 'b=2']);
  });
});

describe('hasHeader', () => {
  it('should check header existence case-insensitively', () => {
    const response = HttpResponse(200, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(hasHeader(response, 'content-type')).toBe(true);
    expect(hasHeader(response, 'CONTENT-TYPE')).toBe(true);
    expect(hasHeader(response, 'X-Custom')).toBe(false);
  });
});

describe('getHeaderLine', () => {
  it('should return string header as-is', () => {
    const response = HttpResponse(200, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(getHeaderLine(response, 'content-type')).toBe('application/json');
  });

  it('should join array headers with comma and space', () => {
    const response = HttpResponse(200, {
      headers: { Accept: ['application/json', 'text/html', 'text/plain'] },
    });

    expect(getHeaderLine(response, 'accept')).toBe('application/json, text/html, text/plain');
  });

  it('should return empty string for missing header', () => {
    const response = HttpResponse(200);
    expect(getHeaderLine(response, 'X-Custom')).toBe('');
  });

  it('should handle case-insensitive lookup', () => {
    const response = HttpResponse(200, {
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(getHeaderLine(response, 'content-type')).toBe('text/plain');
    expect(getHeaderLine(response, 'CONTENT-TYPE')).toBe('text/plain');
  });
});
