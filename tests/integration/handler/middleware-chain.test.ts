import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest } from '../../../src/message/request';
import type { HttpResponse } from '../../../src/message/response';
import { HandlerStack, setHandler, push, resolve } from '../../../src/handler/stack';
import { mapRequest, mapResponse } from '../../../src/middleware/index';
import { FetchHandler } from '../../../src/handler/fetch';

// グローバル fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// モック Response
const createMockResponse = (
  status: number,
  statusText: string,
  headers: Record<string, string>,
  body: string,
) => {
  const mockHeaders = new Map(Object.entries(headers));
  return {
    status,
    statusText,
    headers: {
      forEach: (callback: (value: string, key: string) => void) => {
        mockHeaders.forEach((value, key) => callback(value, key));
      },
    },
    text: () => Promise.resolve(body),
  };
};

beforeEach(() => {
  mockFetch.mockClear();
});

describe('Middleware Chain Integration', () => {
  it('should execute middleware chain in correct order', async () => {
    // ミドルウェアチェーンの実行順序を記録
    const executionOrder: string[] = [];

    // リクエストを変換するミドルウェア
    const addAuthHeader = mapRequest((request: HttpRequest) => {
      executionOrder.push('add-auth');
      return {
        ...request,
        headers: { ...request.headers, Authorization: 'Bearer token' },
      };
    });

    // レスポンスを変換するミドルウェア
    const addResponseHeader = mapResponse((response: HttpResponse) => {
      executionOrder.push('add-response-header');
      return {
        ...response,
        headers: { ...response.headers, 'X-Processed': 'true' },
      };
    });

    // ハンドラースタックの構築
    let stack = HandlerStack();
    stack = setHandler(stack, FetchHandler());
    stack = push(stack, addAuthHeader, 'auth');
    stack = push(stack, addResponseHeader, 'response-header');

    // スタックの解決
    const handler = resolve(stack);

    // モックの設定
    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'Content-Type': 'application/json' }, '{"success":true}'),
    );

    // リクエストの実行
    const request: HttpRequest = {
      method: 'GET',
      uri: 'https://api.example.com/data',
      headers: {},
      body: null,
      version: '1.1',
    };

    const response = await handler(request, {});

    // 実行順序の検証
    expect(executionOrder).toEqual(['add-auth', 'add-response-header']);

    // リクエストヘッダーが追加されていることを確認
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }) as Record<string, string>,
      }) as RequestInit,
    );

    // レスポンスヘッダーが追加されていることを確認
    expect(response.headers['X-Processed']).toBe('true');
    expect(response.statusCode).toBe(200);
  });

  it('should compose multiple request middleware', async () => {
    const addHeader1 = mapRequest(
      (request: HttpRequest): HttpRequest => ({
        ...request,
        headers: { ...request.headers, 'X-Header-1': 'value1' },
      }),
    );

    const addHeader2 = mapRequest(
      (request: HttpRequest): HttpRequest => ({
        ...request,
        headers: { ...request.headers, 'X-Header-2': 'value2' },
      }),
    );

    const addHeader3 = mapRequest(
      (request: HttpRequest): HttpRequest => ({
        ...request,
        headers: { ...request.headers, 'X-Header-3': 'value3' },
      }),
    );

    let stack = HandlerStack();
    stack = setHandler(stack, FetchHandler());
    stack = push(stack, addHeader1, 'h1');
    stack = push(stack, addHeader2, 'h2');
    stack = push(stack, addHeader3, 'h3');

    const handler = resolve(stack);

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    const request: HttpRequest = {
      method: 'GET',
      uri: 'https://example.com',
      headers: {},
      body: null,
      version: '1.1',
    };

    await handler(request, {});

    // 全てのヘッダーが追加されていることを確認
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Header-1': 'value1',
          'X-Header-2': 'value2',
          'X-Header-3': 'value3',
        }) as Record<string, string>,
      }) as RequestInit,
    );
  });

  it('should compose multiple response middleware', async () => {
    const modifyStatus = mapResponse(
      (response: HttpResponse): HttpResponse => ({
        ...response,
        headers: { ...response.headers, 'X-Middleware-1': 'applied' },
      }),
    );

    const addCustomHeader = mapResponse(
      (response: HttpResponse): HttpResponse => ({
        ...response,
        headers: { ...response.headers, 'X-Middleware-2': 'applied' },
      }),
    );

    let stack = HandlerStack();
    stack = setHandler(stack, FetchHandler());
    stack = push(stack, modifyStatus, 'm1');
    stack = push(stack, addCustomHeader, 'm2');

    const handler = resolve(stack);

    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'X-Original': 'header' }, 'response body'),
    );

    const request: HttpRequest = {
      method: 'GET',
      uri: 'https://example.com',
      headers: {},
      body: null,
      version: '1.1',
    };

    const response = await handler(request, {});

    // オリジナルのヘッダーが保持されている
    expect(response.headers['X-Original']).toBe('header');
    // 両方のミドルウェアが適用されている
    expect(response.headers['X-Middleware-1']).toBe('applied');
    expect(response.headers['X-Middleware-2']).toBe('applied');
  });

  it('should pass options through middleware chain', async () => {
    const checkOptions = mapRequest((request: HttpRequest): HttpRequest => request);

    let stack = HandlerStack();
    stack = setHandler(stack, FetchHandler());
    stack = push(stack, checkOptions, 'check');

    const handler = resolve(stack);

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    const request: HttpRequest = {
      method: 'GET',
      uri: 'https://example.com',
      headers: {},
      body: null,
      version: '1.1',
    };

    const options = { timeout: 5000, customOption: 'test' };
    await handler(request, options);

    // オプションが正しく渡されていることを確認
    // (FetchHandlerがtimeoutオプションを使用している)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        signal: expect.any(AbortSignal) as AbortSignal,
      }) as RequestInit,
    );
  });

  it('should work with empty middleware stack', async () => {
    let stack = HandlerStack();
    stack = setHandler(stack, FetchHandler());

    const handler = resolve(stack);

    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'Content-Type': 'text/plain' }, 'Hello'),
    );

    const request: HttpRequest = {
      method: 'GET',
      uri: 'https://example.com',
      headers: {},
      body: null,
      version: '1.1',
    };

    const response = await handler(request, {});

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('text/plain');
  });
});
