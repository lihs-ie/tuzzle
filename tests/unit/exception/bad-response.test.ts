import { describe, it, expect } from 'vitest';
import {
  createBadResponseError,
  isBadResponseError,
  throwBadResponseError,
  extractBadResponseError,
} from '../../../src/exception/bad-response.js';
import type { BadResponseError } from '../../../src/exception/bad-response.js';
import type { HttpRequest } from '../../../src/message/request.js';
import type { HttpResponse } from '../../../src/message/response.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';
import { HttpResponse as createHttpResponse } from '../../../src/message/response.js';

describe('BadResponseError', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api');
  const mockResponse: HttpResponse = createHttpResponse(400);

  describe('createBadResponseError', () => {
    it('should create BadResponseError with message, request, and response', () => {
      const error = createBadResponseError('HTTP error', mockRequest, mockResponse);
      expect(error.type).toBe('BadResponseError');
      expect(error.message).toBe('HTTP error');
      expect(error.request).toBe(mockRequest);
      expect(error.response).toBe(mockResponse);
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create BadResponseError with cause', () => {
      const cause = new Error('Underlying error');
      const error = createBadResponseError('HTTP error', mockRequest, mockResponse, { cause });
      expect(error.type).toBe('BadResponseError');
      expect(error.cause).toBe(cause);
    });

    it('should create BadResponseError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createBadResponseError('HTTP error', mockRequest, mockResponse, {
        stack: customStack,
      });
      expect(error.stack).toBe(customStack);
    });
  });

  describe('isBadResponseError', () => {
    it('should return true for BadResponseError', () => {
      const error = createBadResponseError('HTTP error', mockRequest, mockResponse);
      expect(isBadResponseError(error)).toBe(true);
    });

    it('should return false for non-BadResponseError objects', () => {
      const plainError = new Error('Plain error');
      expect(isBadResponseError(plainError)).toBe(false);
      expect(isBadResponseError({ message: 'Not an error' })).toBe(false);
      expect(isBadResponseError(null)).toBe(false);
      expect(isBadResponseError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = {
        type: 'WrongType',
        message: 'Fake',
        request: mockRequest,
        response: mockResponse,
      };
      expect(isBadResponseError(fakeError)).toBe(false);
    });

    it('should return false for objects without response', () => {
      const fakeError = {
        type: 'BadResponseError',
        message: 'Fake',
        request: mockRequest,
        response: null,
      };
      expect(isBadResponseError(fakeError)).toBe(false);
    });

    it('should return false for RequestError', () => {
      const requestError = {
        type: 'RequestError',
        message: 'Request error',
        request: mockRequest,
      };
      expect(isBadResponseError(requestError)).toBe(false);
    });
  });

  describe('throwBadResponseError', () => {
    it('should throw standard Error', () => {
      const badResponseError = createBadResponseError('HTTP error', mockRequest, mockResponse);
      expect(() => throwBadResponseError(badResponseError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const badResponseError = createBadResponseError('HTTP error', mockRequest, mockResponse);
      expect(() => throwBadResponseError(badResponseError)).toThrow('HTTP error');
    });

    it('should attach BadResponseError as cause', () => {
      const badResponseError = createBadResponseError('HTTP error', mockRequest, mockResponse);
      try {
        throwBadResponseError(badResponseError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(badResponseError);
        }
      }
    });
  });

  describe('extractBadResponseError', () => {
    it('should extract BadResponseError from Error', () => {
      const originalError = createBadResponseError('HTTP error', mockRequest, mockResponse);
      try {
        throwBadResponseError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractBadResponseError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without BadResponseError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractBadResponseError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractBadResponseError('string')).toBeNull();
      expect(extractBadResponseError(123)).toBeNull();
      expect(extractBadResponseError(null)).toBeNull();
      expect(extractBadResponseError(undefined)).toBeNull();
    });
  });

  describe('inheritance from RequestError', () => {
    it('should extend RequestError structure', () => {
      const error = createBadResponseError('HTTP error', mockRequest, mockResponse);
      // BadResponseError should have all RequestError properties
      expect(error.type).toBe('BadResponseError');
      expect(error.message).toBeDefined();
      expect(error.request).toBeDefined();
      expect(error.stack).toBeDefined();
      // Plus response property
      expect(error.response).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: BadResponseError = createBadResponseError(
        'HTTP error',
        mockRequest,
        mockResponse,
      );

      // TypeScript prevents these assignments at compile time
      expect(error.type).toBe('BadResponseError');
      expect(error.message).toBe('HTTP error');

      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
      // @ts-expect-error - readonly property cannot be assigned
      error.response = createHttpResponse(500);
    });
  });
});
