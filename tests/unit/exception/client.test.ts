import { describe, it, expect } from 'vitest';
import {
  createClientError,
  isClientError,
  extractClientError,
} from '../../../src/exception/client.js';
import type { ClientError } from '../../../src/exception/client.js';
import { throwError } from '../../../src/exception/common.js';
import type { HttpRequest } from '../../../src/message/request.js';
import type { HttpResponse } from '../../../src/message/response.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';
import { HttpResponse as createHttpResponse } from '../../../src/message/response.js';

describe('ClientError', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api');
  const mockResponse: HttpResponse = createHttpResponse(404);

  describe('createClientError', () => {
    it('should create ClientError with message, request, and response', () => {
      const error = createClientError('Not found', mockRequest, mockResponse);
      expect(error.type).toBe('ClientError');
      expect(error.message).toBe('Not found');
      expect(error.request).toBe(mockRequest);
      expect(error.response).toBe(mockResponse);
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create ClientError with cause', () => {
      const cause = new Error('Underlying error');
      const error = createClientError('Not found', mockRequest, mockResponse, { cause });
      expect(error.type).toBe('ClientError');
      expect(error.cause).toBe(cause);
    });

    it('should create ClientError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createClientError('Not found', mockRequest, mockResponse, {
        stack: customStack,
      });
      expect(error.stack).toBe(customStack);
    });

    it('should work with 4xx status codes', () => {
      const response400 = createHttpResponse(400);
      const error400 = createClientError('Bad request', mockRequest, response400);
      expect(error400.response.statusCode).toBe(400);

      const response403 = createHttpResponse(403);
      const error403 = createClientError('Forbidden', mockRequest, response403);
      expect(error403.response.statusCode).toBe(403);

      const response404 = createHttpResponse(404);
      const error404 = createClientError('Not found', mockRequest, response404);
      expect(error404.response.statusCode).toBe(404);
    });
  });

  describe('isClientError', () => {
    it('should return true for ClientError', () => {
      const error = createClientError('Not found', mockRequest, mockResponse);
      expect(isClientError(error)).toBe(true);
    });

    it('should return false for non-ClientError objects', () => {
      const plainError = new Error('Plain error');
      expect(isClientError(plainError)).toBe(false);
      expect(isClientError({ message: 'Not an error' })).toBe(false);
      expect(isClientError(null)).toBe(false);
      expect(isClientError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = {
        type: 'WrongType',
        message: 'Fake',
        request: mockRequest,
        response: mockResponse,
      };
      expect(isClientError(fakeError)).toBe(false);
    });

    it('should return false for objects without response', () => {
      const fakeError = {
        type: 'ClientError',
        message: 'Fake',
        request: mockRequest,
        response: null,
      };
      expect(isClientError(fakeError)).toBe(false);
    });

    it('should return false for BadResponseError', () => {
      const badResponseError = {
        type: 'BadResponseError',
        message: 'Bad response',
        request: mockRequest,
        response: mockResponse,
      };
      expect(isClientError(badResponseError)).toBe(false);
    });
  });

  describe('throwError', () => {
    it('should throw standard Error', () => {
      const clientError = createClientError('Not found', mockRequest, mockResponse);
      expect(() => throwError(clientError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const clientError = createClientError('Not found', mockRequest, mockResponse);
      expect(() => throwError(clientError)).toThrow('Not found');
    });

    it('should attach ClientError as cause', () => {
      const clientError = createClientError('Not found', mockRequest, mockResponse);
      try {
        throwError(clientError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(clientError);
        }
      }
    });
  });

  describe('extractClientError', () => {
    it('should extract ClientError from Error', () => {
      const originalError = createClientError('Not found', mockRequest, mockResponse);
      try {
        throwError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractClientError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without ClientError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractClientError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractClientError('string')).toBeNull();
      expect(extractClientError(123)).toBeNull();
      expect(extractClientError(null)).toBeNull();
      expect(extractClientError(undefined)).toBeNull();
    });
  });

  describe('inheritance from BadResponseError', () => {
    it('should extend BadResponseError structure', () => {
      const error = createClientError('Not found', mockRequest, mockResponse);
      // ClientError should have all BadResponseError properties
      expect(error.type).toBe('ClientError');
      expect(error.message).toBeDefined();
      expect(error.request).toBeDefined();
      expect(error.response).toBeDefined();
      expect(error.stack).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: ClientError = createClientError('Not found', mockRequest, mockResponse);

      // TypeScript prevents these assignments at compile time
      expect(error.type).toBe('ClientError');
      expect(error.message).toBe('Not found');

      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
      // @ts-expect-error - readonly property cannot be assigned
      error.response = createHttpResponse(500);
    });
  });
});
