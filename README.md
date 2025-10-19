# tuzzle

[![npm version](https://img.shields.io/npm/v/tuzzle.svg)](https://www.npmjs.com/package/tuzzle)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A type-safe HTTP client for TypeScript inspired by [GuzzleHTTP](https://github.com/guzzle/guzzle). Features middleware support, interceptors, and comprehensive type safety.

## Features

- **Type-Safe**: Fully typed with TypeScript strict mode
- **Middleware Support**: Extensible middleware architecture
- **PSR-7 Compatible**: Message interfaces inspired by PSR-7
- **Test Friendly**: Built-in mock handler and history middleware
- **Modern**: Built on native `fetch` API
- **Tree-Shakeable**: ES modules with optimized exports
- **Zero Dependencies**: Lightweight with no runtime dependencies

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
import { HttpClient, HandlerStack } from 'tuzzle';
import type { Middleware } from 'tuzzle';

// Create a custom middleware
const loggingMiddleware: Middleware = (next) => async (request, options) => {
  console.log(`Request: ${request.method} ${request.uri}`);
  const response = await next(request, options);
  console.log(`Response: ${response.statusCode}`);
  return response;
};

// Create handler stack and add middleware
const stack = HandlerStack();
stack.push(loggingMiddleware, 'logging');

const client = HttpClient({
  baseURL: 'https://api.example.com',
  handlerStack: stack,
});
```

### Testing with Mock Handler

```typescript
import { HttpClient, HandlerStack } from 'tuzzle';

// Create a mock handler with queue
const mockQueue = [
  { statusCode: 200, body: JSON.stringify({ users: ['Alice', 'Bob'] }) },
  { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) },
];

// Mock handler implementation
const mockHandler = async (request, options) => {
  const mock = mockQueue.shift();
  if (!mock) {
    throw new Error('No more mocked responses');
  }
  return {
    statusCode: mock.statusCode,
    reasonPhrase: '',
    headers: {},
    body: mock.body,
    version: '1.1',
  };
};

const stack = HandlerStack(mockHandler);
const client = HttpClient({ handlerStack: stack });

// These requests will use mocked responses
const response1 = await client.get('/users'); // Returns 200 with users array
const response2 = await client.get('/notfound'); // Returns 404 with error
```

### History Middleware

```typescript
import { HttpClient, HandlerStack } from 'tuzzle';
import type { Middleware, HttpRequest, HttpResponse, RequestOptions } from 'tuzzle';

// Create history tracking middleware
type HistoryEntry = {
  request: HttpRequest;
  response: HttpResponse;
  options: RequestOptions;
};

const history: HistoryEntry[] = [];

const historyMiddleware: Middleware = (next) => async (request, options) => {
  const response = await next(request, options);
  history.push({ request, response, options });
  return response;
};

const stack = HandlerStack();
stack.push(historyMiddleware, 'history');

const client = HttpClient({ handlerStack: stack });
await client.get('/api/test');

// Inspect request history
console.log(history[0].request.method); // 'GET'
console.log(history[0].response.statusCode); // 200
```

## API Reference

### Core

- `HttpClient(config?)` - Create a new HTTP client
- `Method` - HTTP method constants (GET, POST, PUT, DELETE, etc.)

### Messages (PSR-7 Compatible)

- `HttpRequest(method, uri, options?)` - Create an HTTP request
- `HttpResponse(statusCode, options?)` - Create an HTTP response
- `HttpHeaders(entries?)` - Create HTTP headers
- `HttpBodyStream(content)` - Create a body stream

Each message type provides immutable methods:

```typescript
// HttpRequest methods
request.withMethod(newMethod)
request.withUri(newUri)
request.withHeader(key, value)
request.withoutHeader(key)
request.withBody(body)
request.getHeader(key)
request.hasHeader(key)
request.getHeaderLine(key)

// HttpResponse methods
response.withStatus(statusCode, reasonPhrase?)
response.withHeader(key, value)
response.withoutHeader(key)
response.withBody(body)
response.withVersion(version)
response.getHeader(key)
response.hasHeader(key)
response.getHeaderLine(key)

// HttpHeaders methods
headers.set(key, value)
headers.get(key)
headers.has(key)
headers.remove(key)
headers.keys()
headers.entries()
```

### Handlers & Middleware

- `HandlerStack(handler?)` - Create a handler stack
- `stack.push(middleware, name)` - Add middleware to the end
- `stack.unshift(middleware, name)` - Add middleware to the beginning
- `stack.before(findName, middleware, name)` - Insert middleware before another
- `stack.after(findName, middleware, name)` - Insert middleware after another
- `stack.remove(name)` - Remove middleware by name
- `stack.setHandler(handler)` - Set the base handler
- `stack.resolve()` - Resolve the middleware chain to a handler function

### Cookies

- `CookieJar()` - Create a cookie jar
- `jar.add(cookie)` - Add a cookie
- `jar.remove(name, domain, path)` - Remove a cookie
- `jar.getCookiesForRequest(request)` - Get cookies for a request
- `parseSetCookie(header)` - Parse Set-Cookie header

### Exceptions

All exceptions follow a functional pattern with immutable error objects:

- `TuzzleError` - Base error type
- `TransferError` - Transfer-related errors
- `ConnectError` - Connection errors
- `RequestError` - Request-related errors
- `BadResponseError` - Base for 4xx/5xx errors
- `ClientError` - 4xx HTTP errors
- `ServerError` - 5xx HTTP errors
- `TooManyRedirectsError` - Redirect limit exceeded

Each error type provides:

- `create{Type}Error(params)` - Factory function to create error object
- `is{Type}Error(value)` - Type guard to check if value is this error type
- `extract{Type}Error(error)` - Extract error object from JavaScript Error
- `throwError(error)` - Throw any tuzzle error as JavaScript Error

Example:

```typescript
import { createClientError, isClientError, throwError } from 'tuzzle';

// Create error object
const error = createClientError({
  message: 'Resource not found',
  request: request,
  response: response,
});

// Type guard
if (isClientError(unknownValue)) {
  console.log(unknownValue.statusCode); // Type-safe access
}

// Throw error
throwError(error); // Throws JavaScript Error with error in cause
```

### Error Message Formatting

- `formatErrorMessage(error, request?, response?)` - Format error message with context
- `summarizeBody(body, maxLength?)` - Summarize body content
- `summarizeBodyStream(stream, maxLength?)` - Summarize body stream content

## TypeScript Support

tuzzle is written in TypeScript and provides full type definitions out of the box:

```typescript
import type {
  ClientConfig,
  RequestOptions,
  HttpHeaders,
  Handler,
  Middleware,
  TransferStats,
  TuzzleError,
  ClientError,
  ServerError,
} from 'tuzzle';
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

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm type-check

# Lint
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format check
pnpm format

# Format and write
pnpm format:write

# Build
pnpm build

# Build bundle only
pnpm build:bundle

# Build types only
pnpm build:types
```

## License

MIT © lihs

## Acknowledgments

This project is inspired by [GuzzleHTTP](https://github.com/guzzle/guzzle) (MIT License).
Original PHP implementation by Michael Dowling and contributors.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
