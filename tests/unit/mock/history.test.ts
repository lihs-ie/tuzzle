import { describe, it, expect } from 'vitest';
import { createHistoryMiddleware, clearHistory, getLastHistoryEntry } from '../../mock/history.js';
import type { HistoryEntry } from '../../mock/history.js';
import { HttpRequest } from '../../../src/message/request.js';
import { HttpResponse } from '../../../src/message/response.js';
import type { Handler, RequestOptions } from '../../../src/handler/stack.js';

describe('createHistoryMiddleware', () => {
  it('should create history middleware', () => {
    const history = { current: [] as HistoryEntry[] };
    const middleware = createHistoryMiddleware(history);

    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });

  it('should record successful request', async () => {
    const history = { current: [] as HistoryEntry[] };
    const middleware = createHistoryMiddleware(history);

    const mockHandler: Handler = () => Promise.resolve(HttpResponse(200, {}));
    const handler = middleware(mockHandler);

    const request = HttpRequest('GET', 'https://example.com/api');
    const options: RequestOptions = {};

    await handler(request, options);

    expect(history.current).toHaveLength(1);
    expect(history.current[0]?.request).toBe(request);
    expect(history.current[0]?.response?.statusCode).toBe(200);
    expect(history.current[0]?.error).toBeNull();
  });

  it('should record failed request', async () => {
    const history = { current: [] as HistoryEntry[] };
    const middleware = createHistoryMiddleware(history);

    const testError = new Error('Network error');
    const mockHandler: Handler = () => Promise.reject(testError);
    const handler = middleware(mockHandler);

    const request = HttpRequest('GET', 'https://example.com/api');
    const options: RequestOptions = {};

    await expect(handler(request, options)).rejects.toThrow('Network error');

    expect(history.current).toHaveLength(1);
    expect(history.current[0]?.request).toBe(request);
    expect(history.current[0]?.response).toBeNull();
    expect(history.current[0]?.error).toBe(testError);
  });

  it('should record multiple requests in order', async () => {
    const history = { current: [] as HistoryEntry[] };
    const middleware = createHistoryMiddleware(history);

    const mockHandler: Handler = (request) => {
      if (request.uri.includes('first')) {
        return Promise.resolve(HttpResponse(200, {}));
      }
      return Promise.resolve(HttpResponse(404, {}));
    };
    const handler = middleware(mockHandler);

    const request1 = HttpRequest('GET', 'https://example.com/first');
    const request2 = HttpRequest('GET', 'https://example.com/second');
    const options: RequestOptions = {};

    await handler(request1, options);
    await handler(request2, options);

    expect(history.current).toHaveLength(2);
    expect(history.current[0]?.request).toBe(request1);
    expect(history.current[0]?.response?.statusCode).toBe(200);
    expect(history.current[1]?.request).toBe(request2);
    expect(history.current[1]?.response?.statusCode).toBe(404);
  });
});

describe('clearHistory', () => {
  it('should clear history', () => {
    const history = { current: [] as HistoryEntry[] };
    const entry: HistoryEntry = {
      request: HttpRequest('GET', 'https://example.com'),
      response: HttpResponse(200, {}),
      error: null,
      options: {},
    };
    history.current.push(entry);

    expect(history.current).toHaveLength(1);

    clearHistory(history);

    expect(history.current).toHaveLength(0);
  });
});

describe('getLastHistoryEntry', () => {
  it('should return last entry', () => {
    const history = { current: [] as HistoryEntry[] };
    const entry1: HistoryEntry = {
      request: HttpRequest('GET', 'https://example.com/first'),
      response: HttpResponse(200, {}),
      error: null,
      options: {},
    };
    const entry2: HistoryEntry = {
      request: HttpRequest('GET', 'https://example.com/second'),
      response: HttpResponse(404, {}),
      error: null,
      options: {},
    };

    history.current.push(entry1);
    history.current.push(entry2);

    const last = getLastHistoryEntry(history);
    expect(last).toBe(entry2);
  });

  it('should return null for empty history', () => {
    const history = { current: [] as HistoryEntry[] };
    const last = getLastHistoryEntry(history);
    expect(last).toBeNull();
  });
});
