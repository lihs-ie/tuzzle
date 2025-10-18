import { describe, it, expect } from 'vitest';
import { mockResponse, mockJsonResponse, mockErrorResponse } from '../../mock/queue.js';

describe('mockResponse', () => {
  it('should create response with status code', () => {
    const response = mockResponse(200);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeNull();
  });

  it('should create response with body', () => {
    const response = mockResponse(200, 'OK');
    expect(response.statusCode).toBe(200);
    expect(response.body?.content).toBe('OK');
  });

  it('should create response with headers', () => {
    const response = mockResponse(200, 'OK', { 'X-Custom': 'value' });
    expect(response.statusCode).toBe(200);
    expect(response.headers.get('X-Custom')).toBe('value');
  });
});

describe('mockJsonResponse', () => {
  it('should create JSON response', () => {
    const data = { users: ['Alice', 'Bob'] };
    const response = mockJsonResponse(200, data);

    expect(response.statusCode).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.body?.content).toBe(JSON.stringify(data));
  });

  it('should merge custom headers with Content-Type', () => {
    const response = mockJsonResponse(200, {}, { 'X-Custom': 'value' });

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('X-Custom')).toBe('value');
  });
});

describe('mockErrorResponse', () => {
  it('should create error response', () => {
    const response = mockErrorResponse(404, 'Not found');

    expect(response.statusCode).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.body?.content).toBe(JSON.stringify({ error: 'Not found' }));
  });
});
