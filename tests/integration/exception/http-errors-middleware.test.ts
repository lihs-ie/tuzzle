import { describe, it, expect } from 'vitest';
import { httpErrors } from '../../../src/middleware/http-errors.js';
import { HandlerStack } from '../../../src/handler/stack.js';
import { HttpRequest } from '../../../src/message/request.js';
import { HttpResponse } from '../../../src/message/response.js';
import { extractClientError, extractServerError } from '../../../src/exception/index.js';
import type { Handler, RequestOptions } from '../../../src/handler/stack.js';
import type { HttpResponse as HttpResponseType } from '../../../src/message/response.js';

describe('httpErrors middleware integration', () => {
  // モックハンドラー: 指定されたステータスコードのレスポンスを返す
  const createMockHandler = (statusCode: number): Handler => {
    return async () => Promise.resolve(HttpResponse(statusCode, {}));
  };

  describe('when httpErrors option is true', () => {
    const options: RequestOptions = { httpErrors: true };

    it('should throw ClientError for 404 response', async () => {
      const stack = HandlerStack(createMockHandler(404)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/not-found');

      await expect(handler(request, options)).rejects.toThrow();

      try {
        await handler(request, options);
      } catch (error) {
        const clientError = extractClientError(error as Error);
        expect(clientError).not.toBeNull();
        expect(clientError?.response.statusCode).toBe(404);
        expect(clientError?.message).toContain('404');
        expect(clientError?.message).toContain('Not Found');
      }
    });

    it('should throw ClientError for 400 response', async () => {
      const stack = HandlerStack(createMockHandler(400)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('POST', 'https://example.com/api');

      await expect(handler(request, options)).rejects.toThrow();

      try {
        await handler(request, options);
      } catch (error) {
        const clientError = extractClientError(error as Error);
        expect(clientError).not.toBeNull();
        expect(clientError?.response.statusCode).toBe(400);
        expect(clientError?.message).toContain('400');
      }
    });

    it('should throw ServerError for 500 response', async () => {
      const stack = HandlerStack(createMockHandler(500)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/error');

      await expect(handler(request, options)).rejects.toThrow();

      try {
        await handler(request, options);
      } catch (error) {
        const serverError = extractServerError(error as Error);
        expect(serverError).not.toBeNull();
        expect(serverError?.response.statusCode).toBe(500);
        expect(serverError?.message).toContain('500');
        expect(serverError?.message).toContain('Internal Server Error');
      }
    });

    it('should throw ServerError for 503 response', async () => {
      const stack = HandlerStack(createMockHandler(503)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/unavailable');

      await expect(handler(request, options)).rejects.toThrow();

      try {
        await handler(request, options);
      } catch (error) {
        const serverError = extractServerError(error as Error);
        expect(serverError).not.toBeNull();
        expect(serverError?.response.statusCode).toBe(503);
        expect(serverError?.message).toContain('503');
      }
    });

    it('should NOT throw for 200 response', async () => {
      const stack = HandlerStack(createMockHandler(200)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/success');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(200);
    });

    it('should NOT throw for 201 response', async () => {
      const stack = HandlerStack(createMockHandler(201)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('POST', 'https://example.com/created');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(201);
    });

    it('should NOT throw for 204 response', async () => {
      const stack = HandlerStack(createMockHandler(204)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('DELETE', 'https://example.com/resource');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(204);
    });

    it('should NOT throw for 3xx redirect responses', async () => {
      const stack = HandlerStack(createMockHandler(301)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/redirect');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(301);
    });
  });

  describe('when httpErrors option is false', () => {
    const options: RequestOptions = { httpErrors: false };

    it('should NOT throw for 404 response', async () => {
      const stack = HandlerStack(createMockHandler(404)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/not-found');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(404);
    });

    it('should NOT throw for 500 response', async () => {
      const stack = HandlerStack(createMockHandler(500)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/error');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(500);
    });
  });

  describe('when httpErrors option is not set', () => {
    const options: RequestOptions = {};

    it('should NOT throw for 404 response', async () => {
      const stack = HandlerStack(createMockHandler(404)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/not-found');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(404);
    });

    it('should NOT throw for 500 response', async () => {
      const stack = HandlerStack(createMockHandler(500)).push(httpErrors(), 'http_errors');
      const handler = stack.resolve();
      const request = HttpRequest('GET', 'https://example.com/error');

      const response: HttpResponseType = await handler(request, options);
      expect(response.statusCode).toBe(500);
    });
  });
});
