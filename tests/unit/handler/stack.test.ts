import { describe, it, expect } from 'vitest';
import type { HttpRequest } from '../../../src/message/request';
import type { HttpResponse } from '../../../src/message/response';
import {
  HandlerStack,
  setHandler,
  push,
  unshift,
  before,
  after,
  remove,
  resolve,
  hasHandler,
  type Handler,
  type Middleware,
} from '../../../src/handler/stack';

// モックハンドラー
const createMockHandler = (name: string): Handler => {
  return () =>
    Promise.resolve({
      statusCode: 200,
      reasonPhrase: 'OK',
      headers: { 'X-Handler': name },
      body: null,
      version: '1.1',
    } as HttpResponse);
};

// モックミドルウェア
const createMockMiddleware = (name: string): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: Record<string, unknown>) => {
      const modifiedRequest = {
        ...request,
        headers: { ...request.headers, [`X-Middleware-${name}`]: 'passed' },
      };
      const response = await next(modifiedRequest, options);
      return {
        ...response,
        headers: { ...response.headers, [`X-Response-${name}`]: 'processed' },
      };
    };
  };
};

describe('HandlerStack', () => {
  it('should create empty stack without handler', () => {
    const stack = HandlerStack();

    expect(stack.handler).toBeNull();
    expect(stack.stack).toEqual([]);
  });

  it('should create stack with handler', () => {
    const handler = createMockHandler('test');
    const stack = HandlerStack(handler);

    expect(stack.handler).toBe(handler);
    expect(stack.stack).toEqual([]);
  });
});

describe('setHandler', () => {
  it('should set handler without mutating original stack', () => {
    const original = HandlerStack();
    const handler = createMockHandler('test');
    const updated = setHandler(original, handler);

    expect(updated.handler).toBe(handler);
    expect(updated).not.toBe(original);
    expect(original.handler).toBeNull();
  });
});

describe('push', () => {
  it('should add middleware to top of stack', () => {
    const stack = HandlerStack();
    const middleware = createMockMiddleware('A');
    const updated = push(stack, middleware, 'middleware-a');

    expect(updated.stack).toHaveLength(1);
    expect(updated.stack[0]?.name).toBe('middleware-a');
    expect(updated.stack[0]?.middleware).toBe(middleware);
  });

  it('should not mutate original stack', () => {
    const original = HandlerStack();
    const middleware = createMockMiddleware('A');
    const updated = push(original, middleware, 'middleware-a');

    expect(updated).not.toBe(original);
    expect(original.stack).toHaveLength(0);
    expect(updated.stack).toHaveLength(1);
  });

  it('should add multiple middleware in order', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    stack = push(stack, createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(2);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('b');
  });
});

describe('unshift', () => {
  it('should add middleware to bottom of stack', () => {
    const stack = HandlerStack();
    const middleware = createMockMiddleware('A');
    const updated = unshift(stack, middleware, 'middleware-a');

    expect(updated.stack).toHaveLength(1);
    expect(updated.stack[0]?.name).toBe('middleware-a');
  });

  it('should insert at beginning when stack has items', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    stack = unshift(stack, createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(2);
    expect(stack.stack[0]?.name).toBe('b');
    expect(stack.stack[1]?.name).toBe('a');
  });
});

describe('before', () => {
  it('should insert middleware before specified name', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    stack = push(stack, createMockMiddleware('C'), 'c');
    stack = before(stack, 'c', createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(3);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('b');
    expect(stack.stack[2]?.name).toBe('c');
  });

  it('should return same stack if name not found', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    const updated = before(stack, 'nonexistent', createMockMiddleware('B'), 'b');

    expect(updated).toBe(stack);
  });
});

describe('after', () => {
  it('should insert middleware after specified name', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    stack = push(stack, createMockMiddleware('C'), 'c');
    stack = after(stack, 'a', createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(3);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('b');
    expect(stack.stack[2]?.name).toBe('c');
  });

  it('should return same stack if name not found', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    const updated = after(stack, 'nonexistent', createMockMiddleware('B'), 'b');

    expect(updated).toBe(stack);
  });
});

describe('remove', () => {
  it('should remove middleware by name', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    stack = push(stack, createMockMiddleware('B'), 'b');
    stack = push(stack, createMockMiddleware('C'), 'c');
    stack = remove(stack, 'b');

    expect(stack.stack).toHaveLength(2);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('c');
  });

  it('should return same stack if name not found', () => {
    let stack = HandlerStack();
    stack = push(stack, createMockMiddleware('A'), 'a');
    const updated = remove(stack, 'nonexistent');

    expect(updated).toBe(stack);
  });
});

describe('hasHandler', () => {
  it('should return false when no handler set', () => {
    const stack = HandlerStack();
    expect(hasHandler(stack)).toBe(false);
  });

  it('should return true when handler is set', () => {
    const handler = createMockHandler('test');
    const stack = HandlerStack(handler);
    expect(hasHandler(stack)).toBe(true);
  });
});

describe('resolve', () => {
  it('should throw error when no handler set', () => {
    const stack = HandlerStack();
    expect(() => resolve(stack)).toThrow('No handler has been set');
  });

  it('should return handler when stack is empty', async () => {
    const handler = createMockHandler('test');
    const stack = HandlerStack(handler);
    const resolved = resolve(stack);

    const request = {
      method: 'GET',
      uri: 'https://example.com',
      headers: {},
      body: null,
      version: '1.1',
    } as HttpRequest;

    const response = await resolved(request, {});
    expect(response.headers['X-Handler']).toBe('test');
  });

  it('should compose middleware chain correctly', async () => {
    let stack = HandlerStack(createMockHandler('handler'));
    stack = push(stack, createMockMiddleware('A'), 'a');
    stack = push(stack, createMockMiddleware('B'), 'b');

    const resolved = resolve(stack);
    const request = {
      method: 'GET',
      uri: 'https://example.com',
      headers: {},
      body: null,
      version: '1.1',
    } as HttpRequest;

    const response = await resolved(request, {});

    // リクエストは A → B の順で処理
    expect(request.headers['X-Middleware-A']).toBeUndefined(); // 元のrequestは変更されない
    // レスポンスは B → A の逆順で処理
    expect(response.headers['X-Response-A']).toBe('processed');
    expect(response.headers['X-Response-B']).toBe('processed');
  });
});
