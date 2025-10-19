import { describe, it, expect } from 'vitest';
import { HttpRequest } from '../../../src/message/request';
import { HttpResponse } from '../../../src/message/response';
import { HandlerStack, type Handler, type Middleware } from '../../../src/handler/stack';
import { Method } from '../../../src/method';
import { HttpHeaders } from '../../../src/message/headers';

// Mock handler
const createMockHandler = (name: string): Handler => {
  return () =>
    Promise.resolve(
      HttpResponse(200, {
        reasonPhrase: 'OK',
        headers: HttpHeaders({ 'X-Handler': name }),
      }),
    );
};

// Mock middleware
const createMockMiddleware = (name: string): Middleware => {
  return (next: Handler) => {
    return async (request: HttpRequest, options: Record<string, unknown>) => {
      const modifiedRequest = {
        ...request,
        headers: request.headers.set(`X-Middleware-${name}`, 'passed'),
      };
      const response = await next(modifiedRequest, options);
      return {
        ...response,
        headers: response.headers.set(`X-Response-${name}`, 'processed'),
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
    const updated = original.setHandler(handler);

    expect(updated.handler).toBe(handler);
    expect(updated).not.toBe(original);
    expect(original.handler).toBeNull();
  });
});

describe('push', () => {
  it('should add middleware to top of stack', () => {
    const stack = HandlerStack();
    const middleware = createMockMiddleware('A');
    const updated = stack.push(middleware, 'middleware-a');

    expect(updated.stack).toHaveLength(1);
    expect(updated.stack[0]?.name).toBe('middleware-a');
    expect(updated.stack[0]?.middleware).toBe(middleware);
  });

  it('should not mutate original stack', () => {
    const original = HandlerStack();
    const middleware = createMockMiddleware('A');
    const updated = original.push(middleware, 'middleware-a');

    expect(updated).not.toBe(original);
    expect(original.stack).toHaveLength(0);
    expect(updated.stack).toHaveLength(1);
  });

  it('should add multiple middleware in order', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    stack = stack.push(createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(2);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('b');
  });
});

describe('unshift', () => {
  it('should add middleware to bottom of stack', () => {
    const stack = HandlerStack();
    const middleware = createMockMiddleware('A');
    const updated = stack.unshift(middleware, 'middleware-a');

    expect(updated.stack).toHaveLength(1);
    expect(updated.stack[0]?.name).toBe('middleware-a');
  });

  it('should insert at beginning when stack has items', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    stack = stack.unshift(createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(2);
    expect(stack.stack[0]?.name).toBe('b');
    expect(stack.stack[1]?.name).toBe('a');
  });
});

describe('before', () => {
  it('should insert middleware before specified name', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    stack = stack.push(createMockMiddleware('C'), 'c');
    stack = stack.before('c', createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(3);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('b');
    expect(stack.stack[2]?.name).toBe('c');
  });

  it('should return same stack if name not found', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    const updated = stack.before('nonexistent', createMockMiddleware('B'), 'b');

    expect(updated).toBe(stack);
  });
});

describe('after', () => {
  it('should insert middleware after specified name', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    stack = stack.push(createMockMiddleware('C'), 'c');
    stack = stack.after('a', createMockMiddleware('B'), 'b');

    expect(stack.stack).toHaveLength(3);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('b');
    expect(stack.stack[2]?.name).toBe('c');
  });

  it('should return same stack if name not found', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    const updated = stack.after('nonexistent', createMockMiddleware('B'), 'b');

    expect(updated).toBe(stack);
  });
});

describe('remove', () => {
  it('should remove middleware by name', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    stack = stack.push(createMockMiddleware('B'), 'b');
    stack = stack.push(createMockMiddleware('C'), 'c');
    stack = stack.remove('b');

    expect(stack.stack).toHaveLength(2);
    expect(stack.stack[0]?.name).toBe('a');
    expect(stack.stack[1]?.name).toBe('c');
  });

  it('should return same stack if name not found', () => {
    let stack = HandlerStack();
    stack = stack.push(createMockMiddleware('A'), 'a');
    const updated = stack.remove('nonexistent');

    expect(updated).toBe(stack);
  });
});

describe('hasHandler', () => {
  it('should return false when no handler set', () => {
    const stack = HandlerStack();
    expect(stack.hasHandler()).toBe(false);
  });

  it('should return true when handler is set', () => {
    const handler = createMockHandler('test');
    const stack = HandlerStack(handler);
    expect(stack.hasHandler()).toBe(true);
  });
});

describe('resolve', () => {
  it('should throw error when no handler set', () => {
    const stack = HandlerStack();
    expect(() => stack.resolve()).toThrow('No handler has been set');
  });

  it('should return handler when stack is empty', async () => {
    const handler = createMockHandler('test');
    const stack = HandlerStack(handler);
    const resolved = stack.resolve();

    const request = HttpRequest(Method.GET, 'https://example.com');

    const response = await resolved(request, {});
    expect(response.headers.get('X-Handler')).toBe('test');
  });

  it('should compose middleware chain correctly', async () => {
    let stack = HandlerStack(createMockHandler('handler'));
    stack = stack.push(createMockMiddleware('A'), 'a');
    stack = stack.push(createMockMiddleware('B'), 'b');

    const resolved = stack.resolve();
    const request = HttpRequest(Method.GET, 'https://example.com');

    const response = await resolved(request, {});

    // Request is processed in A → B order
    expect(request.headers.get('X-Middleware-A')).toBeUndefined(); // Original request is not modified
    // Response is processed in reverse order B → A
    expect(response.headers.get('X-Response-A')).toBe('processed');
    expect(response.headers.get('X-Response-B')).toBe('processed');
  });
});
