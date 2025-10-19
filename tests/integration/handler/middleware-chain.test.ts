import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpRequest } from '../../../src/message/request';
import type { HttpResponse } from '../../../src/message/response';
import { HandlerStack } from '../../../src/handler/stack';
import { mapRequest, mapResponse } from '../../../src/middleware/index';
import { FetchHandler } from '../../../src/handler/fetch';
import { Method } from '../../../src/method';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Response
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
    // Record middleware chain execution order
    const executionOrder: string[] = [];

    // Middleware to transform request
    const addAuthHeader = mapRequest((request: HttpRequest) => {
      executionOrder.push('add-auth');
      return {
        ...request,
        headers: request.headers.set('Authorization', 'Bearer token'),
      };
    });

    // Middleware to transform response
    const addResponseHeader = mapResponse((response: HttpResponse) => {
      executionOrder.push('add-response-header');
      return {
        ...response,
        headers: response.headers.set('X-Processed', 'true'),
      };
    });

    // Build handler stack
    let stack = HandlerStack();
    stack = stack.setHandler(FetchHandler());
    stack = stack.push(addAuthHeader, 'auth');
    stack = stack.push(addResponseHeader, 'response-header');

    // Resolve stack
    const handler = stack.resolve();

    // Configure mock
    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'Content-Type': 'application/json' }, '{"success":true}'),
    );

    // Execute request
    const request = HttpRequest(Method.GET, 'https://api.example.com/data');

    const response = await handler(request, {});

    // Verify execution order
    expect(executionOrder).toEqual(['add-auth', 'add-response-header']);

    // Verify request header was added
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/data',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
        }) as Record<string, string>,
      }) as RequestInit,
    );

    // Verify response header was added
    expect(response.headers.get('X-Processed')).toBe('true');
    expect(response.statusCode).toBe(200);
  });

  it('should compose multiple request middleware', async () => {
    const addHeader1 = mapRequest(
      (request: HttpRequest): HttpRequest => ({
        ...request,
        headers: request.headers.set('X-Header-1', 'value1'),
      }),
    );

    const addHeader2 = mapRequest(
      (request: HttpRequest): HttpRequest => ({
        ...request,
        headers: request.headers.set('X-Header-2', 'value2'),
      }),
    );

    const addHeader3 = mapRequest(
      (request: HttpRequest): HttpRequest => ({
        ...request,
        headers: request.headers.set('X-Header-3', 'value3'),
      }),
    );

    let stack = HandlerStack();
    stack = stack.setHandler(FetchHandler());
    stack = stack.push(addHeader1, 'h1');
    stack = stack.push(addHeader2, 'h2');
    stack = stack.push(addHeader3, 'h3');

    const handler = stack.resolve();

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    const request = HttpRequest(Method.GET, 'https://example.com');

    await handler(request, {});

    // Verify all headers were added
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
        headers: response.headers.set('X-Middleware-1', 'applied'),
      }),
    );

    const addCustomHeader = mapResponse(
      (response: HttpResponse): HttpResponse => ({
        ...response,
        headers: response.headers.set('X-Middleware-2', 'applied'),
      }),
    );

    let stack = HandlerStack();
    stack = stack.setHandler(FetchHandler());
    stack = stack.push(modifyStatus, 'm1');
    stack = stack.push(addCustomHeader, 'm2');

    const handler = stack.resolve();

    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'X-Original': 'header' }, 'response body'),
    );

    const request = HttpRequest(Method.GET, 'https://example.com');

    const response = await handler(request, {});

    // Original header is preserved
    expect(response.headers.get('X-Original')).toBe('header');
    // Both middleware are applied
    expect(response.headers.get('X-Middleware-1')).toBe('applied');
    expect(response.headers.get('X-Middleware-2')).toBe('applied');
  });

  it('should pass options through middleware chain', async () => {
    const checkOptions = mapRequest((request: HttpRequest): HttpRequest => request);

    let stack = HandlerStack();
    stack = stack.setHandler(FetchHandler());
    stack = stack.push(checkOptions, 'check');

    const handler = stack.resolve();

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    const request = HttpRequest(Method.GET, 'https://example.com');

    const options = { timeout: 5000, customOption: 'test' };
    await handler(request, options);

    // Verify options are passed correctly
    // (FetchHandler uses timeout option)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        signal: expect.any(AbortSignal) as AbortSignal,
      }) as RequestInit,
    );
  });

  it('should work with empty middleware stack', async () => {
    let stack = HandlerStack();
    stack = stack.setHandler(FetchHandler());

    const handler = stack.resolve();

    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'Content-Type': 'text/plain' }, 'Hello'),
    );

    const request = HttpRequest(Method.GET, 'https://example.com');

    const response = await handler(request, {});

    expect(response.statusCode).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain');
  });
});
