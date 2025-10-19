/**
 * Mock response queue management helpers
 * Utility functions to easily generate responses for testing
 */

import type { HttpResponse } from '../../src/message/response.js';
import { HttpResponse as createHttpResponse } from '../../src/message/response.js';
import { HttpBodyStream } from '../../src/message/stream.js';
import { HttpHeaders } from '../../src/message/headers.js';

/**
 * Helper to generate simple responses
 *
 * @param statusCode - Status code
 * @param body - Body string (optional)
 * @param headers - Headers (optional)
 * @returns HttpResponse
 *
 * @example
 * ```typescript
 * const response = mockResponse(200, 'OK');
 * const response404 = mockResponse(404, 'Not Found', { 'X-Error': 'true' });
 * ```
 */
export const mockResponse = (
  statusCode: number,
  body?: string,
  headers?: Record<string, string>,
): HttpResponse => {
  return createHttpResponse(statusCode, {
    body: body ? HttpBodyStream(body) : null,
    headers: HttpHeaders(headers ?? {}),
  });
};

/**
 * Helper to generate JSON responses
 *
 * @param statusCode - Status code
 * @param data - JSON data
 * @param headers - Headers (optional)
 * @returns HttpResponse
 *
 * @example
 * ```typescript
 * const response = mockJsonResponse(200, { users: ['Alice', 'Bob'] });
 * const error = mockJsonResponse(400, { error: 'Bad request' });
 * ```
 */
export const mockJsonResponse = (
  statusCode: number,
  data: unknown,
  headers?: Record<string, string>,
): HttpResponse => {
  return createHttpResponse(statusCode, {
    body: HttpBodyStream(JSON.stringify(data)),
    headers: HttpHeaders({
      'Content-Type': 'application/json',
      ...(headers ?? {}),
    }),
  });
};

/**
 * Helper to generate error responses
 *
 * @param statusCode - Status code
 * @param message - Error message
 * @returns HttpResponse
 *
 * @example
 * ```typescript
 * const error404 = mockErrorResponse(404, 'Not found');
 * const error500 = mockErrorResponse(500, 'Internal server error');
 * ```
 */
export const mockErrorResponse = (statusCode: number, message: string): HttpResponse => {
  return mockJsonResponse(statusCode, { error: message });
};
