import { describe, it, expect } from 'vitest';
import {
  createRequestError,
  isRequestError,
  extractRequestError,
} from '../../../src/exception/request.js';
import type { RequestError } from '../../../src/exception/request.js';
import { throwError } from '../../../src/exception/common.js';
import type { HttpRequest } from '../../../src/message/request.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';

describe('RequestError', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api');

  describe('createRequestError', () => {
    it('should create RequestError with message and request', () => {
      const error = createRequestError('Request failed', mockRequest);
      expect(error.type).toBe('RequestError');
      expect(error.message).toBe('Request failed');
      expect(error.request).toBe(mockRequest);
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create RequestError with cause', () => {
      const cause = new Error('Network error');
      const error = createRequestError('Request failed', mockRequest, { cause });
      expect(error.type).toBe('RequestError');
      expect(error.cause).toBe(cause);
    });

    it('should create RequestError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createRequestError('Request failed', mockRequest, { stack: customStack });
      expect(error.stack).toBe(customStack);
    });
  });

  describe('isRequestError', () => {
    it('should return true for RequestError', () => {
      const error = createRequestError('Request failed', mockRequest);
      expect(isRequestError(error)).toBe(true);
    });

    it('should return false for non-RequestError objects', () => {
      const plainError = new Error('Plain error');
      expect(isRequestError(plainError)).toBe(false);
      expect(isRequestError({ message: 'Not an error' })).toBe(false);
      expect(isRequestError(null)).toBe(false);
      expect(isRequestError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = { type: 'WrongType', message: 'Fake', request: mockRequest };
      expect(isRequestError(fakeError)).toBe(false);
    });

    it('should return false for TransferError', () => {
      const transferError = {
        type: 'TransferError',
        message: 'Transfer error',
        request: mockRequest,
      };
      expect(isRequestError(transferError)).toBe(false);
    });
  });

  describe('throwError', () => {
    it('should throw standard Error', () => {
      const requestError = createRequestError('Request failed', mockRequest);
      expect(() => throwError(requestError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const requestError = createRequestError('Request failed', mockRequest);
      expect(() => throwError(requestError)).toThrow('Request failed');
    });

    it('should attach RequestError as cause', () => {
      const requestError = createRequestError('Request failed', mockRequest);
      try {
        throwError(requestError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(requestError);
        }
      }
    });
  });

  describe('extractRequestError', () => {
    it('should extract RequestError from Error', () => {
      const originalError = createRequestError('Request failed', mockRequest);
      try {
        throwError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractRequestError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without RequestError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractRequestError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractRequestError('string')).toBeNull();
      expect(extractRequestError(123)).toBeNull();
      expect(extractRequestError(null)).toBeNull();
      expect(extractRequestError(undefined)).toBeNull();
    });
  });

  describe('inheritance from TransferError', () => {
    it('should extend TransferError structure', () => {
      const error = createRequestError('Request failed', mockRequest);
      // RequestError should have all TransferError properties
      expect(error.type).toBe('RequestError');
      expect(error.message).toBeDefined();
      expect(error.request).toBeDefined();
      expect(error.stack).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: RequestError = createRequestError('Request failed', mockRequest);

      // TypeScript prevents these assignments at compile time
      expect(error.type).toBe('RequestError');
      expect(error.message).toBe('Request failed');

      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
    });
  });
});
