import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpRequest } from '../../../src/message/request';
import { FetchHandler } from '../../../src/handler/fetch';

// グローバル fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

// モックリクエスト
const createMockRequest = (): HttpRequest => ({
  method: 'GET',
  uri: 'https://example.com/test',
  headers: { 'Content-Type': 'application/json' },
  body: null,
  version: '1.1',
});

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

describe('FetchHandler', () => {
  it('should make HTTP request using fetch API', async () => {
    const handler = FetchHandler();
    const request = createMockRequest();

    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'X-Test': 'value' }, 'response body'),
    );

    const response = await handler(request, {});

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    expect(response.statusCode).toBe(200);
    expect(response.reasonPhrase).toBe('OK');
  });

  it('should convert fetch Response to HttpResponse', async () => {
    const handler = FetchHandler();
    const request = createMockRequest();

    mockFetch.mockResolvedValue(
      createMockResponse(
        201,
        'Created',
        {
          'Content-Type': 'application/json',
          'X-Custom': 'header-value',
        },
        'created resource',
      ),
    );

    const response = await handler(request, {});

    expect(response.statusCode).toBe(201);
    expect(response.reasonPhrase).toBe('Created');
    expect(response.headers['Content-Type']).toBe('application/json');
    expect(response.headers['X-Custom']).toBe('header-value');
    expect(response.body).not.toBeNull();
  });

  it('should handle request body', async () => {
    const handler = FetchHandler();
    const request: HttpRequest = {
      ...createMockRequest(),
      method: 'POST',
      body: {
        content: 'request body',
        size: 12,
        isReadable: true,
      },
    };

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    await handler(request, {});

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        method: 'POST',
        body: 'request body',
      }),
    );
  });

  it('should handle timeout option', async () => {
    const handler = FetchHandler();
    const request = createMockRequest();

    const abortController = new AbortController();
    vi.spyOn(global, 'AbortController').mockImplementation(() => abortController);
    vi.spyOn(abortController, 'abort');

    mockFetch.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return createMockResponse(200, 'OK', {}, '');
    });

    const timeoutPromise = handler(request, { timeout: 100 });
    await timeoutPromise;

    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        signal: abortController.signal,
      }),
    );
  });

  it('should handle fetch errors', async () => {
    const handler = FetchHandler();
    const request = createMockRequest();

    const fetchError = new Error('Network error');
    mockFetch.mockRejectedValue(fetchError);

    await expect(handler(request, {})).rejects.toThrow('Network error');
  });

  it('should handle null body', async () => {
    const handler = FetchHandler();
    const request = createMockRequest();

    mockFetch.mockResolvedValue(createMockResponse(204, 'No Content', {}, ''));

    const response = await handler(request, {});

    expect(response.statusCode).toBe(204);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com/test',
      expect.objectContaining({
        body: null,
      }),
    );
  });
});
