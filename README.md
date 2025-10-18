# tuzzle

[![npm version](https://img.shields.io/npm/v/tuzzle.svg)](https://www.npmjs.com/package/tuzzle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A type-safe HTTP client for TypeScript inspired by [GuzzleHTTP](https://github.com/guzzle/guzzle). Features middleware support, interceptors, and comprehensive type safety.

## Features

- 🔒 **Type-Safe**: Fully typed with TypeScript strict mode
- 🔌 **Middleware Support**: Extensible middleware architecture
- 🎯 **PSR-7 Compatible**: Message interfaces inspired by PSR-7
- 🧪 **Test Friendly**: Built-in mock handler and history middleware
- 🌐 **Modern**: Built on native `fetch` API
- 📦 **Tree-Shakeable**: ES modules with optimized exports
- ⚡ **Zero Dependencies**: Lightweight with no runtime dependencies

## Installation

```bash
npm install tuzzle
# or
yarn add tuzzle
# or
pnpm add tuzzle
```

## Quick Start

### Basic Usage

```typescript
import { HttpClient } from 'tuzzle';

// Create a client instance
const client = HttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'User-Agent': 'tuzzle/1.0',
  },
});

// Make requests
const response = await client.get('/users');
console.log(response.statusCode); // 200
console.log(response.body); // Response body
```

### HTTP Methods

```typescript
// GET request
const users = await client.get('/users');

// POST request with JSON
const newUser = await client.post('/users', {
  json: { name: 'Alice', email: 'alice@example.com' },
});

// PUT request
const updated = await client.put('/users/1', {
  json: { name: 'Alice Smith' },
});

// DELETE request
await client.delete('/users/1');

// Other methods: PATCH, HEAD, OPTIONS
const patched = await client.patch('/users/1', { json: { email: 'new@example.com' } });
const headers = await client.head('/users');
const options = await client.options('/users');
```

### Request Options

```typescript
const response = await client.get('/api/data', {
  headers: { 'X-Custom-Header': 'value' },
  query: { page: 1, limit: 10 },
  timeout: 3000,
  allowRedirects: true,
  httpErrors: true, // Throw on 4xx/5xx
});
```

### Middleware

```typescript
import { HttpClient, HandlerStack, push } from 'tuzzle';

// Create a custom middleware
const loggingMiddleware = (next) => async (request, options) => {
  console.log(`Request: ${request.method} ${request.uri}`);
  const response = await next(request, options);
  console.log(`Response: ${response.statusCode}`);
  return response;
};

// Apply middleware
const stack = HandlerStack();
const stackWithLogging = push(stack, loggingMiddleware, 'logging');

const client = HttpClient({
  baseURL: 'https://api.example.com',
  handlerStack: stackWithLogging,
});
```

### Testing with Mock Handler

```typescript
import { HttpClient, HandlerStack, createMockHandler, mockJsonResponse } from 'tuzzle/tests/mock';

// Create a mock handler
const mockHandler = createMockHandler({
  queue: [
    mockJsonResponse(200, { users: ['Alice', 'Bob'] }),
    mockJsonResponse(404, { error: 'Not found' }),
  ],
});

const stack = HandlerStack(mockHandler);
const client = HttpClient({ handlerStack: stack });

// These requests will use mocked responses
const response1 = await client.get('/users'); // Returns 200 with users array
const response2 = await client.get('/notfound'); // Returns 404 with error
```

### History Middleware

```typescript
import { HttpClient, HandlerStack, push, createHistoryMiddleware } from 'tuzzle';

const history = { current: [] };
const mockHandler = createMockHandler({
  queue: [mockJsonResponse(200, { data: 'test' })],
});

const stack = push(HandlerStack(mockHandler), createHistoryMiddleware(history), 'history');

const client = HttpClient({ handlerStack: stack });
await client.get('/api/test');

// Inspect request history
console.log(history.current[0].request.method); // 'GET'
console.log(history.current[0].response.statusCode); // 200
```

## API Reference

### Core

- `HttpClient(config?)` - Create a new HTTP client
- `Method` - HTTP method constants (GET, POST, PUT, DELETE, etc.)

### Messages (PSR-7 Compatible)

- `HttpRequest(method, uri, options?)` - Create an HTTP request
- `HttpResponse(statusCode, options?)` - Create an HTTP response
- `HttpBodyStream(content)` - Create a body stream
- Header utilities: `setHeader`, `getHeader`, `hasHeader`, `removeHeader`, `mergeHeaders`

### Handlers & Middleware

- `HandlerStack(handler?)` - Create a handler stack
- `push(stack, middleware, name)` - Add middleware to the end
- `unshift(stack, middleware, name)` - Add middleware to the beginning
- `before(stack, findName, middleware, name)` - Insert middleware before another
- `after(stack, findName, middleware, name)` - Insert middleware after another
- `remove(stack, name)` - Remove middleware by name
- `setHandler(stack, handler)` - Set the base handler
- `resolve(stack)` - Resolve the middleware chain to a handler function

### Cookies

- `CookieJar()` - Create a cookie jar
- `addCookie(jar, cookie)` - Add a cookie
- `removeCookie(jar, name, domain, path)` - Remove a cookie
- `getCookiesForRequest(jar, request)` - Get cookies for a request
- `parseSetCookie(header)` - Parse Set-Cookie header

### Exceptions

All exceptions follow a functional pattern with type guards:

- `TuzzleError` - Base error type
- `RequestError` - Request-related errors
- `ConnectError` - Connection errors
- `ClientError` - 4xx HTTP errors
- `ServerError` - 5xx HTTP errors
- `TransferError` - Transfer-related errors

Each error type provides:

- `create{Type}Error()` - Factory function
- `is{Type}Error()` - Type guard
- `throw{Type}Error()` - Throw helper
- `extract{Type}Error()` - Extract error from unknown

## TypeScript Support

tuzzle is written in TypeScript and provides full type definitions out of the box:

```typescript
import type { ClientConfig, RequestOptions, HttpHeaders, Handler, Middleware } from 'tuzzle';
```

## Requirements

- Node.js >= 20.11.0
- TypeScript >= 5.0 (for TypeScript users)

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint

# Build
pnpm build
```

## License

MIT © lihs

## Acknowledgments

This project is inspired by [GuzzleHTTP](https://github.com/guzzle/guzzle) (MIT License).
Original PHP implementation by Michael Dowling and contributors.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
