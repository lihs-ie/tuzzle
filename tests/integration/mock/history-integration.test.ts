import { describe, it, expect, beforeEach } from 'vitest';
import { HttpClient } from '../../../src/client.js';
import { HandlerStack } from '../../../src/handler/stack.js';
import {
  createMockHandler,
  mockResponse,
  mockJsonResponse,
  createHistoryMiddleware,
  clearHistory,
  getLastHistoryEntry,
} from '../../mock/index.js';
import type { HistoryEntry } from '../../mock/index.js';

describe('History Middleware Integration Tests', () => {
  let history: { current: HistoryEntry[] };

  beforeEach(() => {
    history = { current: [] };
  });

  it('should record request and response history', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK'), mockResponse(404, 'Not Found')],
    });

    const stack = HandlerStack(mockHandler).push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await client.get('/users');
    await client.post('/users', { json: { name: 'John' } });

    expect(history.current).toHaveLength(2);

    const firstEntry = history.current[0];
    expect(firstEntry?.request.method).toBe('GET');
    expect(firstEntry?.request.uri).toContain('/users');
    expect(firstEntry?.response?.statusCode).toBe(200);
    expect(firstEntry?.error).toBeNull();

    const secondEntry = history.current[1];
    expect(secondEntry?.request.method).toBe('POST');
    expect(secondEntry?.response?.statusCode).toBe(404);
    expect(secondEntry?.error).toBeNull();
  });

  it('should record errors in history', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK'), new Error('Network error')],
    });

    const stack = HandlerStack(mockHandler).push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await client.get('/success');

    await expect(client.get('/failure')).rejects.toThrow('Network error');

    expect(history.current).toHaveLength(2);

    const successEntry = history.current[0];
    expect(successEntry?.response?.statusCode).toBe(200);
    expect(successEntry?.error).toBeNull();

    const errorEntry = history.current[1];
    expect(errorEntry?.response).toBeNull();
    expect(errorEntry?.error?.message).toBe('Network error');
  });

  it('should clear history', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK'), mockResponse(201, 'Created')],
    });

    const stack = HandlerStack(mockHandler).push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await client.get('/test1');
    await client.get('/test2');

    expect(history.current).toHaveLength(2);

    clearHistory(history);

    expect(history.current).toHaveLength(0);
  });

  it('should get last history entry', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'First'), mockResponse(200, 'Second'), mockResponse(200, 'Third')],
    });

    const stack = HandlerStack(mockHandler).push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await client.get('/test1');
    await client.get('/test2');
    await client.get('/test3');

    const lastEntry = getLastHistoryEntry(history);
    expect(lastEntry?.request.uri).toContain('/test3');
    expect(lastEntry?.response?.statusCode).toBe(200);
  });

  it('should record request options in history', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK')],
    });

    const stack = HandlerStack(mockHandler).push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
      headers: {
        Authorization: 'Bearer token',
      },
    });

    await client.get('/test', {
      delay: 100,
      headers: { 'X-Custom': 'value' },
    });

    const entry = history.current[0];
    expect(entry?.options.delay).toBe(100);
    expect(entry?.request.headers.get('Authorization')).toBe('Bearer token');
    expect(entry?.request.headers.get('X-Custom')).toBe('value');
  });

  it('should work with multiple middlewares', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK')],
    });

    // カスタムミドルウェアを追加
    const customMiddleware = HandlerStack(mockHandler).push(
      (next) => async (request, options) => {
        const modifiedRequest = {
          ...request,
          headers: request.headers.set('X-Middleware', 'custom'),
        };
        return await next(modifiedRequest, options);
      },
      'custom',
    );

    // ヒストリーミドルウェアを追加
    const stack = customMiddleware.push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await client.get('/test');

    const entry = history.current[0];
    expect(entry?.request.headers.get('X-Middleware')).toBe('custom');
    expect(entry?.response?.statusCode).toBe(200);
  });

  it('should handle concurrent requests', async () => {
    const mockHandler = createMockHandler({
      queue: [
        mockResponse(200, 'Response 1'),
        mockResponse(200, 'Response 2'),
        mockResponse(200, 'Response 3'),
      ],
    });

    const stack = HandlerStack(mockHandler).push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    // 並行リクエスト
    await Promise.all([client.get('/test1'), client.get('/test2'), client.get('/test3')]);

    expect(history.current).toHaveLength(3);

    // すべてのリクエストが記録されていることを確認
    const uris = history.current.map((entry) => entry.request.uri);
    expect(uris.some((uri) => uri.includes('/test1'))).toBe(true);
    expect(uris.some((uri) => uri.includes('/test2'))).toBe(true);
    expect(uris.some((uri) => uri.includes('/test3'))).toBe(true);
  });

  it('should verify request flow through history', async () => {
    const mockHandler = createMockHandler({
      queue: [
        mockJsonResponse(200, { users: [] }),
        mockJsonResponse(201, { id: 1, name: 'Alice' }),
        mockJsonResponse(200, { id: 1, name: 'Alice', email: 'alice@example.com' }),
      ],
    });

    const stack = HandlerStack(mockHandler).push(createHistoryMiddleware(history), 'history');

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    // 1. ユーザー一覧取得
    const usersResponse = await client.get('/users');
    expect(usersResponse.statusCode).toBe(200);

    // 2. ユーザー作成
    const createResponse = await client.post('/users', {
      json: { name: 'Alice' },
    });
    expect(createResponse.statusCode).toBe(201);

    // 3. ユーザー詳細取得
    const userResponse = await client.get('/users/1');
    expect(userResponse.statusCode).toBe(200);

    // 履歴を検証
    expect(history.current).toHaveLength(3);

    const getRequest = history.current[0];
    expect(getRequest?.request.method).toBe('GET');
    expect(getRequest?.request.uri).toContain('/users');

    const postRequest = history.current[1];
    expect(postRequest?.request.method).toBe('POST');
    expect(postRequest?.request.uri).toContain('/users');

    const getUserRequest = history.current[2];
    expect(getUserRequest?.request.method).toBe('GET');
    expect(getUserRequest?.request.uri).toContain('/users/1');
  });

  it('should preserve history across client instances', async () => {
    const mockHandler1 = createMockHandler({
      queue: [mockResponse(200, 'Client 1')],
    });

    const mockHandler2 = createMockHandler({
      queue: [mockResponse(200, 'Client 2')],
    });

    // 同じhistoryコンテナを共有
    const stack1 = HandlerStack(mockHandler1).push(createHistoryMiddleware(history), 'history');
    const stack2 = HandlerStack(mockHandler2).push(createHistoryMiddleware(history), 'history');

    const client1 = HttpClient({
      baseURL: 'https://api1.example.com',
      handlerStack: stack1,
    });

    const client2 = HttpClient({
      baseURL: 'https://api2.example.com',
      handlerStack: stack2,
    });

    await client1.get('/test1');
    await client2.get('/test2');

    // 両方のリクエストが同じhistoryに記録される
    expect(history.current).toHaveLength(2);

    expect(history.current[0]?.request.uri).toContain('api1.example.com');
    expect(history.current[1]?.request.uri).toContain('api2.example.com');
  });

  it('should handle empty history', () => {
    const lastEntry = getLastHistoryEntry(history);
    expect(lastEntry).toBeNull();
  });
});
