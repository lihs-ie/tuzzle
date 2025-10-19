import { describe, it, expect } from 'vitest';
import { HttpClient } from '../../../src/client.js';
import { HandlerStack } from '../../../src/handler/stack.js';
import {
  createMockHandler,
  mockResponse,
  mockJsonResponse,
  mockErrorResponse,
  getLastRequest,
  countMockQueue,
  appendMockQueue,
} from '../../mock/index.js';
import type { MockItem } from '../../mock/index.js';

describe('Mock Handler Integration Tests', () => {
  it('should integrate with HttpClient using mock handler', async () => {
    // Create mock handler
    const mockHandler = createMockHandler({
      queue: [
        mockJsonResponse(200, { users: ['Alice', 'Bob'] }),
        mockJsonResponse(201, { id: 1, name: 'Charlie' }),
      ],
    });

    // Set in handler stack
    const stack = HandlerStack(mockHandler);

    // Create HttpClient
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    // Execute requests
    const response1 = await client.get('/users');
    expect(response1.statusCode).toBe(200);
    expect(response1.body?.content).toContain('Alice');

    const response2 = await client.post('/users', { json: { name: 'Charlie' } });
    expect(response2.statusCode).toBe(201);
    expect(response2.body?.content).toContain('Charlie');
  });

  it('should handle errors in mock handler with HttpClient', async () => {
    const mockHandler = createMockHandler({
      queue: [new Error('Network connection failed')],
    });

    const stack = HandlerStack(mockHandler);
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await expect(client.get('/api')).rejects.toThrow('Network connection failed');
  });

  it('should use mock handler with middleware stack', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK')],
    });

    // Add middleware
    const stack = HandlerStack(mockHandler).push(
      (next) => async (request, options) => {
        // Add custom header to request
        const modifiedRequest = {
          ...request,
          headers: request.headers.set('X-Custom-Middleware', 'true'),
        };
        return await next(modifiedRequest, options);
      },
      'custom-header',
    );

    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await client.get('/test');

    // Verify request passed to mock handler
    const lastRequest = getLastRequest(mockHandler);
    expect(lastRequest?.headers.get('X-Custom-Middleware')).toBe('true');
  });

  it('should handle dynamic mock responses based on request', async () => {
    const dynamicMock: MockItem = (request) => {
      if (request.uri.includes('/users')) {
        return mockJsonResponse(200, { users: [] });
      }
      if (request.uri.includes('/posts')) {
        return mockJsonResponse(200, { posts: [] });
      }
      return mockErrorResponse(404, 'Not found');
    };

    const mockHandler = createMockHandler({
      queue: [dynamicMock, dynamicMock, dynamicMock],
    });

    const stack = HandlerStack(mockHandler);
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    const usersResponse = await client.get('/users');
    expect(usersResponse.statusCode).toBe(200);
    expect(usersResponse.body?.content).toContain('users');

    const postsResponse = await client.get('/posts');
    expect(postsResponse.statusCode).toBe(200);
    expect(postsResponse.body?.content).toContain('posts');

    const notFoundResponse = await client.get('/unknown');
    expect(notFoundResponse.statusCode).toBe(404);
    expect(notFoundResponse.body?.content).toContain('Not found');
  });

  it('should append responses to queue during test execution', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'First')],
    });

    const stack = HandlerStack(mockHandler);
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    // First response
    const response1 = await client.get('/test');
    expect(response1.body?.content).toBe('First');
    expect(countMockQueue(mockHandler)).toBe(0);

    // Add new responses
    appendMockQueue(mockHandler, mockResponse(201, 'Second'), mockResponse(202, 'Third'));
    expect(countMockQueue(mockHandler)).toBe(2);

    // Get added responses
    const response2 = await client.get('/test');
    expect(response2.body?.content).toBe('Second');

    const response3 = await client.get('/test');
    expect(response3.body?.content).toBe('Third');
  });

  it('should work with request options like delay', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK')],
    });

    const stack = HandlerStack(mockHandler);
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    const start = Date.now();
    await client.get('/test', { delay: 100 });
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(95); // Allow 5ms tolerance
  });

  it('should capture request details in mock handler', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK')],
    });

    const stack = HandlerStack(mockHandler);
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
      headers: {
        Authorization: 'Bearer token',
      },
    });

    await client.post('/api/users', {
      json: { name: 'John' },
      headers: { 'X-Request-ID': '123' },
    });

    const lastRequest = getLastRequest(mockHandler);
    expect(lastRequest?.method).toBe('POST');
    expect(lastRequest?.uri).toContain('/api/users');
    expect(lastRequest?.headers.get('Authorization')).toBe('Bearer token');
    expect(lastRequest?.headers.get('X-Request-ID')).toBe('123');
  });

  it('should handle multiple clients with separate mock handlers', async () => {
    const mockHandler1 = createMockHandler({
      queue: [mockResponse(200, 'Client 1')],
    });

    const mockHandler2 = createMockHandler({
      queue: [mockResponse(200, 'Client 2')],
    });

    const stack1 = HandlerStack(mockHandler1);
    const stack2 = HandlerStack(mockHandler2);

    const client1 = HttpClient({
      baseURL: 'https://api1.example.com',
      handlerStack: stack1,
    });

    const client2 = HttpClient({
      baseURL: 'https://api2.example.com',
      handlerStack: stack2,
    });

    const response1 = await client1.get('/test');
    const response2 = await client2.get('/test');

    expect(response1.body?.content).toBe('Client 1');
    expect(response2.body?.content).toBe('Client 2');

    const lastRequest1 = getLastRequest(mockHandler1);
    const lastRequest2 = getLastRequest(mockHandler2);

    expect(lastRequest1?.uri).toContain('api1.example.com');
    expect(lastRequest2?.uri).toContain('api2.example.com');
  });

  it('should test callbacks with mock handler', async () => {
    let fulfilledCount = 0;
    let rejectedCount = 0;

    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'OK'), new Error('Test error'), mockResponse(201, 'Created')],
      onFulfilled: () => {
        fulfilledCount++;
      },
      onRejected: () => {
        rejectedCount++;
      },
    });

    const stack = HandlerStack(mockHandler);
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    await client.get('/test1');
    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(0);

    await expect(client.get('/test2')).rejects.toThrow('Test error');
    expect(fulfilledCount).toBe(1);
    expect(rejectedCount).toBe(1);

    await client.post('/test3');
    expect(fulfilledCount).toBe(2);
    expect(rejectedCount).toBe(1);
  });

  it('should verify all mocked requests were consumed', async () => {
    const mockHandler = createMockHandler({
      queue: [mockResponse(200, 'First'), mockResponse(200, 'Second'), mockResponse(200, 'Third')],
    });

    const stack = HandlerStack(mockHandler);
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      handlerStack: stack,
    });

    expect(countMockQueue(mockHandler)).toBe(3);

    await client.get('/test');
    expect(countMockQueue(mockHandler)).toBe(2);

    await client.get('/test');
    expect(countMockQueue(mockHandler)).toBe(1);

    await client.get('/test');
    expect(countMockQueue(mockHandler)).toBe(0);

    // Error occurs because queue is empty
    await expect(client.get('/test')).rejects.toThrow('Mock queue is empty');
  });
});
