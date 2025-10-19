import { describe, it, expect } from 'vitest';
import {
  createServerError,
  isServerError,
  extractServerError,
} from '../../../src/exception/server.js';
import type { ServerError } from '../../../src/exception/server.js';
import { throwError } from '../../../src/exception/common.js';
import type { HttpRequest } from '../../../src/message/request.js';
import type { HttpResponse } from '../../../src/message/response.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';
import { HttpResponse as createHttpResponse } from '../../../src/message/response.js';

describe('ServerError', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api');
  const mockResponse: HttpResponse = createHttpResponse(500);

  describe('createServerError', () => {
    it('should create ServerError with message, request, and response', () => {
      const error = createServerError('Internal server error', mockRequest, mockResponse);
      expect(error.type).toBe('ServerError');
      expect(error.message).toBe('Internal server error');
      expect(error.request).toBe(mockRequest);
      expect(error.response).toBe(mockResponse);
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create ServerError with cause', () => {
      const cause = new Error('Underlying error');
      const error = createServerError('Internal server error', mockRequest, mockResponse, {
        cause,
      });
      expect(error.type).toBe('ServerError');
      expect(error.cause).toBe(cause);
    });

    it('should create ServerError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createServerError('Internal server error', mockRequest, mockResponse, {
        stack: customStack,
      });
      expect(error.stack).toBe(customStack);
    });

    it('should work with 5xx status codes', () => {
      const response500 = createHttpResponse(500);
      const error500 = createServerError('Internal server error', mockRequest, response500);
      expect(error500.response.statusCode).toBe(500);

      const response502 = createHttpResponse(502);
      const error502 = createServerError('Bad gateway', mockRequest, response502);
      expect(error502.response.statusCode).toBe(502);

      const response503 = createHttpResponse(503);
      const error503 = createServerError('Service unavailable', mockRequest, response503);
      expect(error503.response.statusCode).toBe(503);
    });
  });

  describe('isServerError', () => {
    it('should return true for ServerError', () => {
      const error = createServerError('Internal server error', mockRequest, mockResponse);
      expect(isServerError(error)).toBe(true);
    });

    it('should return false for non-ServerError objects', () => {
      const plainError = new Error('Plain error');
      expect(isServerError(plainError)).toBe(false);
      expect(isServerError({ message: 'Not an error' })).toBe(false);
      expect(isServerError(null)).toBe(false);
      expect(isServerError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = {
        type: 'WrongType',
        message: 'Fake',
        request: mockRequest,
        response: mockResponse,
      };
      expect(isServerError(fakeError)).toBe(false);
    });

    it('should return false for objects without response', () => {
      const fakeError = {
        type: 'ServerError',
        message: 'Fake',
        request: mockRequest,
        response: null,
      };
      expect(isServerError(fakeError)).toBe(false);
    });

    it('should return false for BadResponseError', () => {
      const badResponseError = {
        type: 'BadResponseError',
        message: 'Bad response',
        request: mockRequest,
        response: mockResponse,
      };
      expect(isServerError(badResponseError)).toBe(false);
    });
  });

  describe('throwError', () => {
    it('should throw standard Error', () => {
      const serverError = createServerError('Internal server error', mockRequest, mockResponse);
      expect(() => throwError(serverError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const serverError = createServerError('Internal server error', mockRequest, mockResponse);
      expect(() => throwError(serverError)).toThrow('Internal server error');
    });

    it('should attach ServerError as cause', () => {
      const serverError = createServerError('Internal server error', mockRequest, mockResponse);
      try {
        throwError(serverError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(serverError);
        }
      }
    });
  });

  describe('extractServerError', () => {
    it('should extract ServerError from Error', () => {
      const originalError = createServerError('Internal server error', mockRequest, mockResponse);
      try {
        throwError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractServerError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without ServerError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractServerError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractServerError('string')).toBeNull();
      expect(extractServerError(123)).toBeNull();
      expect(extractServerError(null)).toBeNull();
      expect(extractServerError(undefined)).toBeNull();
    });
  });

  describe('inheritance from BadResponseError', () => {
    it('should extend BadResponseError structure', () => {
      const error = createServerError('Internal server error', mockRequest, mockResponse);
      // ServerError should have all BadResponseError properties
      expect(error.type).toBe('ServerError');
      expect(error.message).toBeDefined();
      expect(error.request).toBeDefined();
      expect(error.response).toBeDefined();
      expect(error.stack).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: ServerError = createServerError(
        'Internal server error',
        mockRequest,
        mockResponse,
      );

      // TypeScript prevents these assignments at compile time
      expect(error.type).toBe('ServerError');
      expect(error.message).toBe('Internal server error');

      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
      // @ts-expect-error - readonly property cannot be assigned
      error.response = createHttpResponse(404);
    });
  });
});
