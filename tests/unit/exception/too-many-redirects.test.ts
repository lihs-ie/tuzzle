import { describe, it, expect } from 'vitest';
import {
  createTooManyRedirectsError,
  isTooManyRedirectsError,
  extractTooManyRedirectsError,
} from '../../../src/exception/too-many-redirects.js';
import type { TooManyRedirectsError } from '../../../src/exception/too-many-redirects.js';
import { throwError } from '../../../src/exception/common.js';
import type { HttpRequest } from '../../../src/message/request.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';

describe('TooManyRedirectsError', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api');

  describe('createTooManyRedirectsError', () => {
    it('should create TooManyRedirectsError with message, request, and redirectCount', () => {
      const error = createTooManyRedirectsError('Too many redirects', mockRequest, 10);
      expect(error.type).toBe('TooManyRedirectsError');
      expect(error.message).toBe('Too many redirects');
      expect(error.request).toBe(mockRequest);
      expect(error.redirectCount).toBe(10);
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create TooManyRedirectsError with cause', () => {
      const cause = new Error('Underlying error');
      const error = createTooManyRedirectsError('Too many redirects', mockRequest, 10, { cause });
      expect(error.type).toBe('TooManyRedirectsError');
      expect(error.cause).toBe(cause);
    });

    it('should create TooManyRedirectsError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createTooManyRedirectsError('Too many redirects', mockRequest, 10, {
        stack: customStack,
      });
      expect(error.stack).toBe(customStack);
    });

    it('should work with different redirect counts', () => {
      const error5 = createTooManyRedirectsError('Too many redirects', mockRequest, 5);
      expect(error5.redirectCount).toBe(5);

      const error20 = createTooManyRedirectsError('Too many redirects', mockRequest, 20);
      expect(error20.redirectCount).toBe(20);

      const error0 = createTooManyRedirectsError('Too many redirects', mockRequest, 0);
      expect(error0.redirectCount).toBe(0);
    });
  });

  describe('isTooManyRedirectsError', () => {
    it('should return true for TooManyRedirectsError', () => {
      const error = createTooManyRedirectsError('Too many redirects', mockRequest, 10);
      expect(isTooManyRedirectsError(error)).toBe(true);
    });

    it('should return false for non-TooManyRedirectsError objects', () => {
      const plainError = new Error('Plain error');
      expect(isTooManyRedirectsError(plainError)).toBe(false);
      expect(isTooManyRedirectsError({ message: 'Not an error' })).toBe(false);
      expect(isTooManyRedirectsError(null)).toBe(false);
      expect(isTooManyRedirectsError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = {
        type: 'WrongType',
        message: 'Fake',
        request: mockRequest,
        redirectCount: 10,
      };
      expect(isTooManyRedirectsError(fakeError)).toBe(false);
    });

    it('should return false for objects without redirectCount', () => {
      const fakeError = {
        type: 'TooManyRedirectsError',
        message: 'Fake',
        request: mockRequest,
        redirectCount: null,
      };
      expect(isTooManyRedirectsError(fakeError)).toBe(false);
    });

    it('should return false for objects with non-number redirectCount', () => {
      const fakeError = {
        type: 'TooManyRedirectsError',
        message: 'Fake',
        request: mockRequest,
        redirectCount: '10',
      };
      expect(isTooManyRedirectsError(fakeError)).toBe(false);
    });

    it('should return false for RequestError', () => {
      const requestError = {
        type: 'RequestError',
        message: 'Request error',
        request: mockRequest,
      };
      expect(isTooManyRedirectsError(requestError)).toBe(false);
    });
  });

  describe('throwError', () => {
    it('should throw standard Error', () => {
      const tooManyRedirectsError = createTooManyRedirectsError(
        'Too many redirects',
        mockRequest,
        10,
      );
      expect(() => throwError(tooManyRedirectsError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const tooManyRedirectsError = createTooManyRedirectsError(
        'Too many redirects',
        mockRequest,
        10,
      );
      expect(() => throwError(tooManyRedirectsError)).toThrow('Too many redirects');
    });

    it('should attach TooManyRedirectsError as cause', () => {
      const tooManyRedirectsError = createTooManyRedirectsError(
        'Too many redirects',
        mockRequest,
        10,
      );
      try {
        throwError(tooManyRedirectsError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(tooManyRedirectsError);
        }
      }
    });
  });

  describe('extractTooManyRedirectsError', () => {
    it('should extract TooManyRedirectsError from Error', () => {
      const originalError = createTooManyRedirectsError('Too many redirects', mockRequest, 10);
      try {
        throwError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractTooManyRedirectsError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without TooManyRedirectsError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractTooManyRedirectsError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractTooManyRedirectsError('string')).toBeNull();
      expect(extractTooManyRedirectsError(123)).toBeNull();
      expect(extractTooManyRedirectsError(null)).toBeNull();
      expect(extractTooManyRedirectsError(undefined)).toBeNull();
    });
  });

  describe('inheritance from RequestError', () => {
    it('should extend RequestError structure', () => {
      const error = createTooManyRedirectsError('Too many redirects', mockRequest, 10);
      // TooManyRedirectsError should have all RequestError properties
      expect(error.type).toBe('TooManyRedirectsError');
      expect(error.message).toBeDefined();
      expect(error.request).toBeDefined();
      expect(error.stack).toBeDefined();
      // Plus redirectCount property
      expect(error.redirectCount).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: TooManyRedirectsError = createTooManyRedirectsError(
        'Too many redirects',
        mockRequest,
        10,
      );

      // TypeScript prevents these assignments at compile time
      expect(error.type).toBe('TooManyRedirectsError');
      expect(error.message).toBe('Too many redirects');
      expect(error.redirectCount).toBe(10);

      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
      // @ts-expect-error - readonly property cannot be assigned
      error.redirectCount = 20;
    });
  });
});
