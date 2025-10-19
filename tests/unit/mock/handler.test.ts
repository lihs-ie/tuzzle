import { describe, it, expect } from 'vitest';
import {
  createMockHandler,
  getLastRequest,
  getLastOptions,
  countMockQueue,
  resetMockQueue,
  appendMockQueue,
} from '../../mock/handler.js';
import type { MockItem } from '../../mock/handler.js';
import { HttpRequest } from '../../../src/message/request.js';
import { HttpResponse } from '../../../src/message/response.js';
import { HttpBodyStream } from '../../../src/message/stream.js';
import type { RequestOptions } from '../../../src/handler/stack.js';

describe('createMockHandler', () => {
  it('should create mock handler', () => {
    const handler = createMockHandler();

    expect(handler).toBeDefined();
    expect(typeof handler).toBe('function');
  });

  it('should throw error when queue is empty', async () => {
    const handler = createMockHandler();
    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};

    await expect(handler(request, options)).rejects.toThrow('Mock queue is empty');
  });

  it('should return response from queue', async () => {
    const response = HttpResponse(200, { body: HttpBodyStream('OK') });
    const handler = createMockHandler({ queue: [response] });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};

    const result = await handler(request, options);

    expect(result).toBe(response);
    expect(result.statusCode).toBe(200);
  });

  it('should throw error from queue', async () => {
    const error = new Error('Network error');
    const handler = createMockHandler({ queue: [error] });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};

    await expect(handler(request, options)).rejects.toThrow('Network error');
  });

  it('should execute function from queue', async () => {
    const mockFn: MockItem = (request) => {
      return HttpResponse(200, {
        body: HttpBodyStream(`Received: ${request.method} ${request.uri}`),
      });
    };
    const handler = createMockHandler({ queue: [mockFn] });

    const request = HttpRequest('POST', 'https://example.com/api');
    const options: RequestOptions = {};

    const result = await handler(request, options);

    expect(result.statusCode).toBe(200);
    expect(result.body?.content).toContain('POST');
    expect(result.body?.content).toContain('/api');
  });

  it('should process queue in order', async () => {
    const response1 = HttpResponse(200, { body: HttpBodyStream('First') });
    const response2 = HttpResponse(404, { body: HttpBodyStream('Second') });
    const handler = createMockHandler({ queue: [response1, response2] });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};

    const result1 = await handler(request, options);
    expect(result1.statusCode).toBe(200);

    const result2 = await handler(request, options);
    expect(result2.statusCode).toBe(404);
  });

  it('should call onFulfilled callback on success', async () => {
    let calledWith: HttpResponse | null = null;
    const response = HttpResponse(200, {});
    const handler = createMockHandler({
      queue: [response],
      onFulfilled: (res) => {
        calledWith = res;
      },
    });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};

    await handler(request, options);

    expect(calledWith).toBe(response);
  });

  it('should call onRejected callback on error', async () => {
    let calledWith: Error | null = null;
    const error = new Error('Test error');
    const handler = createMockHandler({
      queue: [error],
      onRejected: (err) => {
        calledWith = err;
      },
    });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};

    await expect(handler(request, options)).rejects.toThrow('Test error');
    expect(calledWith).toBe(error);
  });

  it('should handle delay option', async () => {
    const response = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response] });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = { delay: 100 };

    const start = Date.now();
    await handler(request, options);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(95); // Allow 5ms tolerance
  });

  it('should call onHeaders callback before processing response', async () => {
    const callOrder: string[] = [];
    const response = HttpResponse(200, {});
    const handler = createMockHandler({
      queue: [response],
      onFulfilled: () => {
        callOrder.push('fulfilled');
      },
    });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {
      onHeaders: (res) => {
        callOrder.push('headers');
        expect(res.statusCode).toBe(200);
      },
    };

    await handler(request, options);

    expect(callOrder).toEqual(['headers', 'fulfilled']);
  });

  it('should call onStats callback with transfer stats', async () => {
    let capturedStats = null;
    const response = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response] });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {
      onStats: (stats) => {
        capturedStats = stats;
      },
    };

    await handler(request, options);

    expect(capturedStats).toBeDefined();
    expect(capturedStats).toMatchObject({
      request,
      response,
      transferTime: 0,
      error: null,
    });
  });

  it('should handle sink option with string path', async () => {
    const response = HttpResponse(200, { body: HttpBodyStream('Test content') });
    const handler = createMockHandler({ queue: [response] });

    const request = HttpRequest('GET', 'https://example.com');
    const tempFile = '/tmp/tuzzle-test-sink.txt';
    const options: RequestOptions = {
      sink: tempFile,
    };

    await handler(request, options);

    // Verify that the file was created
    const fs = await import('fs');
    const content = await fs.promises.readFile(tempFile, 'utf-8');
    expect(content).toBe('Test content');

    // Cleanup
    await fs.promises.unlink(tempFile);
  });

  it('should wrap onHeaders errors', async () => {
    const response = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response] });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {
      onHeaders: () => {
        throw new Error('Header processing failed');
      },
    };

    await expect(handler(request, options)).rejects.toThrow(
      'An error was encountered during the on_headers event',
    );
  });
});

describe('getLastRequest', () => {
  it('should return last request', async () => {
    const response = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response] });

    const request = HttpRequest('GET', 'https://example.com/test');
    const options: RequestOptions = {};

    await handler(request, options);

    const lastRequest = getLastRequest(handler);
    expect(lastRequest).toBe(request);
    expect(lastRequest?.uri).toBe('https://example.com/test');
  });

  it('should return null before any request', () => {
    const handler = createMockHandler();
    const lastRequest = getLastRequest(handler);
    expect(lastRequest).toBeNull();
  });
});

describe('getLastOptions', () => {
  it('should return last options', async () => {
    const response = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response] });

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = { delay: 100 };

    await handler(request, options);

    const lastOptions = getLastOptions(handler);
    expect(lastOptions).toBe(options);
    expect(lastOptions?.delay).toBe(100);
  });

  it('should return null before any request', () => {
    const handler = createMockHandler();
    const lastOptions = getLastOptions(handler);
    expect(lastOptions).toBeNull();
  });
});

describe('countMockQueue', () => {
  it('should return queue count', () => {
    const response1 = HttpResponse(200, {});
    const response2 = HttpResponse(404, {});
    const handler = createMockHandler({ queue: [response1, response2] });

    expect(countMockQueue(handler)).toBe(2);
  });

  it('should return 0 for empty queue', () => {
    const handler = createMockHandler();
    expect(countMockQueue(handler)).toBe(0);
  });

  it('should decrease after processing', async () => {
    const response1 = HttpResponse(200, {});
    const response2 = HttpResponse(404, {});
    const handler = createMockHandler({ queue: [response1, response2] });

    expect(countMockQueue(handler)).toBe(2);

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};
    await handler(request, options);

    expect(countMockQueue(handler)).toBe(1);
  });
});

describe('resetMockQueue', () => {
  it('should reset queue', () => {
    const response = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response] });

    expect(countMockQueue(handler)).toBe(1);

    resetMockQueue(handler);

    expect(countMockQueue(handler)).toBe(0);
  });
});

describe('appendMockQueue', () => {
  it('should append items to queue', () => {
    const response1 = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response1] });

    expect(countMockQueue(handler)).toBe(1);

    const response2 = HttpResponse(404, {});
    const response3 = HttpResponse(500, {});
    appendMockQueue(handler, response2, response3);

    expect(countMockQueue(handler)).toBe(3);
  });

  it('should process appended items in order', async () => {
    const response1 = HttpResponse(200, {});
    const handler = createMockHandler({ queue: [response1] });

    const response2 = HttpResponse(404, {});
    appendMockQueue(handler, response2);

    const request = HttpRequest('GET', 'https://example.com');
    const options: RequestOptions = {};

    const result1 = await handler(request, options);
    expect(result1.statusCode).toBe(200);

    const result2 = await handler(request, options);
    expect(result2.statusCode).toBe(404);
  });
});
