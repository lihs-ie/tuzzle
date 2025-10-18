import { describe, it, expect, vi } from 'vitest';
import { HttpRequest } from '../../../src/message/request';
import { HttpResponse } from '../../../src/message/response';
import type { Handler } from '../../../src/handler/stack';
import { mapRequest, mapResponse, tap } from '../../../src/middleware/index';
import { Method } from '../../../src/method';
import { HttpHeaders } from '../../../src/message/headers';

// モックハンドラー
const createMockHandler = (): Handler => {
  return () =>
    Promise.resolve(
      HttpResponse(200, {
        reasonPhrase: 'OK',
        headers: HttpHeaders({ 'X-Original': 'handler' }),
      }),
    );
};

// モックリクエスト
const createMockRequest = () => HttpRequest(Method.GET, 'https://example.com');

describe('mapRequest', () => {
  it('should transform request before passing to handler', async () => {
    const handler = createMockHandler();
    const middleware = mapRequest((request) => ({
      ...request,
      headers: request.headers.set('X-Modified', 'by-middleware'),
    }));

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    const response = await wrappedHandler(request, {});

    expect(response.statusCode).toBe(200);
  });

  it('should not mutate original request', async () => {
    const handler = createMockHandler();
    const middleware = mapRequest((request) => ({
      ...request,
      uri: 'https://modified.com',
    }));

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    await wrappedHandler(request, {});

    expect(request.uri).toBe('https://example.com');
  });

  it('should allow chaining multiple mapRequest middleware', async () => {
    const handler = createMockHandler();
    const middleware1 = mapRequest((request) => ({
      ...request,
      headers: request.headers.set('X-First', 'applied'),
    }));
    const middleware2 = mapRequest((request) => ({
      ...request,
      headers: request.headers.set('X-Second', 'applied'),
    }));

    const wrappedHandler = middleware2(middleware1(handler));
    const request = createMockRequest();
    const response = await wrappedHandler(request, {});

    expect(response.statusCode).toBe(200);
  });
});

describe('mapResponse', () => {
  it('should transform response after handler execution', async () => {
    const handler = createMockHandler();
    const middleware = mapResponse((response) => ({
      ...response,
      headers: response.headers.set('X-Modified', 'by-middleware'),
    }));

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    const response = await wrappedHandler(request, {});

    expect(response.headers.get('X-Original')).toBe('handler');
    expect(response.headers.get('X-Modified')).toBe('by-middleware');
  });

  it('should allow modifying status code', async () => {
    const handler = createMockHandler();
    const middleware = mapResponse((response) => ({
      ...response,
      statusCode: 201,
      reasonPhrase: 'Created',
    }));

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    const response = await wrappedHandler(request, {});

    expect(response.statusCode).toBe(201);
    expect(response.reasonPhrase).toBe('Created');
  });

  it('should allow chaining multiple mapResponse middleware', async () => {
    const handler = createMockHandler();
    const middleware1 = mapResponse((response) => ({
      ...response,
      headers: response.headers.set('X-First', 'applied'),
    }));
    const middleware2 = mapResponse((response) => ({
      ...response,
      headers: response.headers.set('X-Second', 'applied'),
    }));

    const wrappedHandler = middleware2(middleware1(handler));
    const request = createMockRequest();
    const response = await wrappedHandler(request, {});

    expect(response.headers.get('X-First')).toBe('applied');
    expect(response.headers.get('X-Second')).toBe('applied');
  });
});

describe('tap', () => {
  it('should call before function before handler execution', async () => {
    const handler = createMockHandler();
    const beforeFn = vi.fn();
    const middleware = tap(beforeFn);

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    const options = { timeout: 5000 };

    await wrappedHandler(request, options);

    expect(beforeFn).toHaveBeenCalledTimes(1);
    expect(beforeFn).toHaveBeenCalledWith(request, options);
  });

  it('should call after function after handler execution', async () => {
    const handler = createMockHandler();
    const afterFn = vi.fn();
    const middleware = tap(undefined, afterFn);

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    const options = { timeout: 5000 };

    await wrappedHandler(request, options);

    expect(afterFn).toHaveBeenCalledTimes(1);
    expect(afterFn).toHaveBeenCalledWith(request, options, expect.any(Promise));
  });

  it('should call both before and after functions', async () => {
    const handler = createMockHandler();
    const beforeFn = vi.fn();
    const afterFn = vi.fn();
    const middleware = tap(beforeFn, afterFn);

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();

    await wrappedHandler(request, {});

    expect(beforeFn).toHaveBeenCalledTimes(1);
    expect(afterFn).toHaveBeenCalledTimes(1);
  });

  it('should not modify request or response', async () => {
    const handler = createMockHandler();
    const beforeFn = vi.fn();
    const afterFn = vi.fn();
    const middleware = tap(beforeFn, afterFn);

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    const response = await wrappedHandler(request, {});

    expect(response.statusCode).toBe(200);
    expect(response.headers.get('X-Original')).toBe('handler');
  });

  it('should work without any functions provided', async () => {
    const handler = createMockHandler();
    const middleware = tap();

    const wrappedHandler = middleware(handler);
    const request = createMockRequest();
    const response = await wrappedHandler(request, {});

    expect(response.statusCode).toBe(200);
  });
});
