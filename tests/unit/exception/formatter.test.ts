import { describe, it, expect } from 'vitest';
import { formatErrorMessage, summarizeBody } from '../../../src/exception/formatter.js';
import type { HttpRequest } from '../../../src/message/request.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';
import type { HttpResponse } from '../../../src/message/response.js';
import { HttpResponse as createHttpResponse, withBody } from '../../../src/message/response.js';
import { HttpBodyStream } from '../../../src/message/stream.js';

describe('formatErrorMessage', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api/users');

  it('should format error message with request info', () => {
    const response: HttpResponse = createHttpResponse(404, {});
    const message = formatErrorMessage('Not found', mockRequest, response);

    expect(message).toContain('Not found');
    expect(message).toContain('GET');
    expect(message).toContain('https://example.com/api/users');
    expect(message).toContain('404');
  });

  it('should include response body summary when present', () => {
    const bodyStream = HttpBodyStream('Validation failed: email is required');
    const response: HttpResponse = withBody(createHttpResponse(400, {}), bodyStream);
    const message = formatErrorMessage('Bad request', mockRequest, response);

    expect(message).toContain('Bad request');
    expect(message).toContain('400');
    expect(message).toContain('Validation failed');
  });

  it('should handle response without body', () => {
    const response: HttpResponse = createHttpResponse(500, {});
    const message = formatErrorMessage('Server error', mockRequest, response);

    expect(message).toContain('Server error');
    expect(message).toContain('500');
    expect(message).not.toContain('undefined');
  });

  it('should handle null response', () => {
    const message = formatErrorMessage('Connection error', mockRequest, null);

    expect(message).toContain('Connection error');
    expect(message).toContain('GET');
    expect(message).toContain('https://example.com/api/users');
    expect(message).not.toContain('undefined');
  });
});

describe('summarizeBody', () => {
  it('should return empty string for null or undefined', () => {
    expect(summarizeBody(null)).toBe('');
    expect(summarizeBody(undefined)).toBe('');
  });

  it('should return short strings as-is', () => {
    const shortBody = 'Error message';
    expect(summarizeBody(shortBody)).toBe(shortBody);
  });

  it('should truncate long strings with ellipsis', () => {
    const longBody = 'a'.repeat(200);
    const summary = summarizeBody(longBody);

    expect(summary.length).toBeLessThan(longBody.length);
    expect(summary).toContain('...');
  });

  it('should handle JSON strings', () => {
    const jsonBody = JSON.stringify({ error: 'Validation failed', details: 'Email is required' });
    const summary = summarizeBody(jsonBody);

    expect(summary).toContain('Validation failed');
  });

  it('should handle HTML responses', () => {
    const htmlBody =
      '<html><body><h1>404 Not Found</h1><p>The requested resource was not found</p></body></html>';
    const summary = summarizeBody(htmlBody);

    expect(summary).toContain('404');
    expect(summary.length).toBeLessThan(htmlBody.length);
  });

  it('should handle multiline text', () => {
    const multilineBody = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
    const summary = summarizeBody(multilineBody);

    expect(summary).toBeDefined();
    expect(typeof summary).toBe('string');
  });

  it('should respect maximum length', () => {
    const body = 'a'.repeat(500);
    const summary = summarizeBody(body, 50);

    expect(summary.length).toBeLessThanOrEqual(53); // 50 + "..."
  });

  it('should handle empty strings', () => {
    expect(summarizeBody('')).toBe('');
  });

  it('should handle whitespace-only strings', () => {
    const whitespace = '   \n  \t  ';
    const summary = summarizeBody(whitespace);

    expect(summary.trim()).toBe('');
  });
});
