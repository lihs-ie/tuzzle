import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../../src/client';

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

describe('Client Integration Tests', () => {
  it('should send HTTP request with default headers', async () => {
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      headers: {
        'User-Agent': 'tuzzle/1.0',
        Accept: 'application/json',
      },
    });

    mockFetch.mockResolvedValue(
      createMockResponse(200, 'OK', { 'Content-Type': 'application/json' }, '{"data":"test"}'),
    );

    const response = await client.get('/users');

    expect(response.statusCode).toBe(200);

    // Verify that default headers are sent
    const callArgs = mockFetch.mock.calls[0];
    const requestInit = callArgs?.[1] as RequestInit | undefined;

    expect(requestInit?.headers).toEqual(
      expect.objectContaining({
        'User-Agent': 'tuzzle/1.0',
        Accept: 'application/json',
      }),
    );
  });

  it('should handle timeout option', async () => {
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      timeout: 100,
    });

    const abortController = new AbortController();
    vi.spyOn(global, 'AbortController').mockImplementation(() => abortController);

    mockFetch.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return createMockResponse(200, 'OK', {}, '');
    });

    await client.get('/test');

    // Verify that timeout signal is set
    const callArgs = mockFetch.mock.calls[0];
    const requestInit = callArgs?.[1] as RequestInit | undefined;

    expect(requestInit?.signal).toBe(abortController.signal);
  });

  it('should handle multiple requests with same client', async () => {
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      headers: {
        Authorization: 'Bearer token',
      },
    });

    mockFetch
      .mockResolvedValueOnce(createMockResponse(200, 'OK', {}, '{"users":[]}'))
      .mockResolvedValueOnce(createMockResponse(201, 'Created', {}, '{"id":1}'))
      .mockResolvedValueOnce(createMockResponse(200, 'OK', {}, '{"id":1,"name":"John"}'));

    // Execute multiple requests sequentially
    const response1 = await client.get('/users');
    const response2 = await client.post('/users', { json: { name: 'John' } });
    const response3 = await client.get('/users/1');

    expect(response1.statusCode).toBe(200);
    expect(response2.statusCode).toBe(201);
    expect(response3.statusCode).toBe(200);

    // Verify that all requests were executed
    expect(mockFetch).toHaveBeenCalledTimes(3);

    // Verify that all requests include the Authorization header
    const calls = mockFetch.mock.calls;

    for (const call of calls) {
      const requestInit = call[1] as RequestInit | undefined;
      expect(requestInit?.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer token',
        }),
      );
    }
  });

  it('should override client headers with request headers', async () => {
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer default-token',
      },
    });

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    await client.get('/test', {
      headers: {
        Authorization: 'Bearer override-token',
        'X-Custom': 'value',
      },
    });

    const callArgs = mockFetch.mock.calls[0];
    const requestInit = callArgs?.[1] as RequestInit | undefined;

    // Request headers override client headers
    expect(requestInit?.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
        Authorization: 'Bearer override-token',
        'X-Custom': 'value',
      }),
    );
  });

  it('should work without base URL', async () => {
    const client = HttpClient();

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    await client.get('https://example.com/full-url');

    expect(mockFetch).toHaveBeenCalledWith('https://example.com/full-url', expect.anything());
  });

  it('should handle different HTTP methods', async () => {
    const client = HttpClient({ baseURL: 'https://api.example.com' });

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    await client.get('/resource');
    await client.post('/resource', { json: {} });
    await client.put('/resource/1', { json: {} });
    await client.patch('/resource/1', { json: {} });
    await client.delete('/resource/1');
    await client.head('/resource');
    await client.options('/resource');

    expect(mockFetch).toHaveBeenCalledTimes(7);

    const calls = mockFetch.mock.calls;

    expect((calls[0]?.[1] as RequestInit)?.method).toBe('GET');
    expect((calls[1]?.[1] as RequestInit)?.method).toBe('POST');
    expect((calls[2]?.[1] as RequestInit)?.method).toBe('PUT');
    expect((calls[3]?.[1] as RequestInit)?.method).toBe('PATCH');
    expect((calls[4]?.[1] as RequestInit)?.method).toBe('DELETE');
    expect((calls[5]?.[1] as RequestInit)?.method).toBe('HEAD');
    expect((calls[6]?.[1] as RequestInit)?.method).toBe('OPTIONS');
  });

  it('should preserve client immutability across requests', async () => {
    const client = HttpClient({
      baseURL: 'https://api.example.com',
      headers: {
        'User-Agent': 'tuzzle/1.0',
      },
      timeout: 3000,
    });

    mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

    // First request
    await client.get('/test1', {
      headers: { 'X-Request-1': 'value1' },
      timeout: 5000,
    });

    // Second request
    await client.get('/test2', {
      headers: { 'X-Request-2': 'value2' },
    });

    // Verify that client configuration is unchanged
    const config = client.getConfig();

    expect(config.baseURL).toBe('https://api.example.com');
    expect(config.headers).toEqual({ 'User-Agent': 'tuzzle/1.0' });
    expect(config.timeout).toBe(3000);

    // Verify that each request is independent
    const call1Headers = (mockFetch.mock.calls[0]?.[1] as RequestInit)?.headers;
    const call2Headers = (mockFetch.mock.calls[1]?.[1] as RequestInit)?.headers;

    expect(call1Headers).toEqual(
      expect.objectContaining({
        'User-Agent': 'tuzzle/1.0',
        'X-Request-1': 'value1',
      }),
    );

    expect(call2Headers).toEqual(
      expect.objectContaining({
        'User-Agent': 'tuzzle/1.0',
        'X-Request-2': 'value2',
      }),
    );

    // Verify that the first request's headers do not include X-Request-2
    expect(call1Headers).not.toEqual(expect.objectContaining({ 'X-Request-2': 'value2' }));
  });
});
