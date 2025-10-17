import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../../src/client';

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

describe('HttpClient', () => {
  it('should create client object without config', () => {
    const client = HttpClient();

    expect(client).toBeDefined();
    expect(client.request).toBeTypeOf('function');
    expect(client.get).toBeTypeOf('function');
    expect(client.post).toBeTypeOf('function');
    expect(client.put).toBeTypeOf('function');
    expect(client.delete).toBeTypeOf('function');
    expect(client.patch).toBeTypeOf('function');
    expect(client.head).toBeTypeOf('function');
    expect(client.options).toBeTypeOf('function');
    expect(client.getConfig).toBeTypeOf('function');
  });

  it('should create client with base URL', () => {
    const client = HttpClient({ baseURL: 'https://api.example.com' });
    const config = client.getConfig();

    expect(config.baseURL).toBe('https://api.example.com');
  });

  it('should create client with default headers', () => {
    const client = HttpClient({
      headers: {
        'User-Agent': 'tuzzle/1.0',
        Accept: 'application/json',
      },
    });
    const config = client.getConfig();

    expect(config.headers).toEqual({
      'User-Agent': 'tuzzle/1.0',
      Accept: 'application/json',
    });
  });

  it('should create client with timeout', () => {
    const client = HttpClient({ timeout: 5000 });
    const config = client.getConfig();

    expect(config.timeout).toBe(5000);
  });

  describe('GET request', () => {
    it('should make GET request', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(
        createMockResponse(200, 'OK', { 'Content-Type': 'application/json' }, '{"success":true}'),
      );

      const response = await client.get('https://api.example.com/users');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
        }) as RequestInit,
      );
      expect(response.statusCode).toBe(200);
    });

    it('should combine base URL with relative path', async () => {
      const client = HttpClient({ baseURL: 'https://api.example.com' });

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.get('/users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', expect.anything());
    });

    it('should use absolute URL even with base URL set', async () => {
      const client = HttpClient({ baseURL: 'https://api.example.com' });

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.get('https://other.example.com/data');

      expect(mockFetch).toHaveBeenCalledWith('https://other.example.com/data', expect.anything());
    });
  });

  describe('POST request', () => {
    it('should make POST request', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(createMockResponse(201, 'Created', {}, ''));

      const response = await client.post('https://api.example.com/users', {
        json: { name: 'John' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
        }) as RequestInit,
      );
      expect(response.statusCode).toBe(201);
    });
  });

  describe('PUT request', () => {
    it('should make PUT request', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.put('https://api.example.com/users/1', {
        json: { name: 'Jane' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
        }) as RequestInit,
      );
    });
  });

  describe('DELETE request', () => {
    it('should make DELETE request', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(createMockResponse(204, 'No Content', {}, ''));

      await client.delete('https://api.example.com/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        }) as RequestInit,
      );
    });
  });

  describe('PATCH request', () => {
    it('should make PATCH request', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.patch('https://api.example.com/users/1', {
        json: { email: 'new@example.com' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
        }) as RequestInit,
      );
    });
  });

  describe('HEAD request', () => {
    it('should make HEAD request', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.head('https://api.example.com/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'HEAD',
        }) as RequestInit,
      );
    });
  });

  describe('OPTIONS request', () => {
    it('should make OPTIONS request', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.options('https://api.example.com/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'OPTIONS',
        }) as RequestInit,
      );
    });
  });

  describe('request method', () => {
    it('should make request with specified method', async () => {
      const client = HttpClient();

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.request('GET', 'https://api.example.com/data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          method: 'GET',
        }) as RequestInit,
      );
    });
  });

  describe('options merging', () => {
    it('should merge client config with request options', async () => {
      const client = HttpClient({
        headers: {
          'User-Agent': 'tuzzle/1.0',
          Accept: 'application/json',
        },
        timeout: 3000,
      });

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.get('/test', {
        headers: {
          Authorization: 'Bearer token',
        },
      });

      // リクエストオプションのheadersがマージされる
      const callArgs = mockFetch.mock.calls[0];
      const requestInit = callArgs?.[1] as RequestInit | undefined;

      expect(requestInit?.headers).toEqual(
        expect.objectContaining({
          'User-Agent': 'tuzzle/1.0',
          Accept: 'application/json',
          Authorization: 'Bearer token',
        }),
      );
    });

    it('should prioritize request options over client config', async () => {
      const client = HttpClient({
        headers: {
          Accept: 'application/json',
        },
        timeout: 3000,
      });

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.get('/test', {
        headers: {
          Accept: 'text/plain',
        },
        timeout: 5000,
      });

      const callArgs = mockFetch.mock.calls[0];
      const requestInit = callArgs?.[1] as RequestInit | undefined;

      // リクエストオプションが優先される
      expect(requestInit?.headers).toEqual(
        expect.objectContaining({
          Accept: 'text/plain',
        }),
      );
    });
  });

  describe('immutability', () => {
    it('should not mutate client config', async () => {
      const originalHeaders = { 'User-Agent': 'tuzzle/1.0' };
      const client = HttpClient({
        baseURL: 'https://api.example.com',
        headers: originalHeaders,
      });

      mockFetch.mockResolvedValue(createMockResponse(200, 'OK', {}, ''));

      await client.get('/test', {
        headers: { Authorization: 'Bearer token' },
      });

      const config = client.getConfig();

      // 元の設定が変更されていないこと
      expect(config.headers).toEqual({ 'User-Agent': 'tuzzle/1.0' });
      expect(originalHeaders).toEqual({ 'User-Agent': 'tuzzle/1.0' });
    });
  });
});
