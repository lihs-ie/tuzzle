import { describe, it, expect } from 'vitest';
import {
  createConnectError,
  isConnectError,
  throwConnectError,
  extractConnectError,
} from '../../../src/exception/connect.js';
import type { ConnectError } from '../../../src/exception/connect.js';
import type { HttpRequest } from '../../../src/message/request.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';

describe('ConnectError', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api');

  describe('createConnectError', () => {
    it('should create ConnectError with message and request', () => {
      const error = createConnectError('Connection refused', mockRequest);
      expect(error.type).toBe('ConnectError');
      expect(error.message).toBe('Connection refused');
      expect(error.request).toBe(mockRequest);
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create ConnectError with cause', () => {
      const cause = new Error('ECONNREFUSED');
      const error = createConnectError('Connection refused', mockRequest, { cause });
      expect(error.type).toBe('ConnectError');
      expect(error.cause).toBe(cause);
    });

    it('should create ConnectError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createConnectError('Connection refused', mockRequest, { stack: customStack });
      expect(error.stack).toBe(customStack);
    });
  });

  describe('isConnectError', () => {
    it('should return true for ConnectError', () => {
      const error = createConnectError('Connection refused', mockRequest);
      expect(isConnectError(error)).toBe(true);
    });

    it('should return false for non-ConnectError objects', () => {
      const plainError = new Error('Plain error');
      expect(isConnectError(plainError)).toBe(false);
      expect(isConnectError({ message: 'Not an error' })).toBe(false);
      expect(isConnectError(null)).toBe(false);
      expect(isConnectError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = { type: 'WrongType', message: 'Fake', request: mockRequest };
      expect(isConnectError(fakeError)).toBe(false);
    });

    it('should return false for TransferError', () => {
      const transferError = {
        type: 'TransferError',
        message: 'Transfer error',
        request: mockRequest,
      };
      expect(isConnectError(transferError)).toBe(false);
    });
  });

  describe('throwConnectError', () => {
    it('should throw standard Error', () => {
      const connectError = createConnectError('Connection refused', mockRequest);
      expect(() => throwConnectError(connectError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const connectError = createConnectError('Connection refused', mockRequest);
      expect(() => throwConnectError(connectError)).toThrow('Connection refused');
    });

    it('should attach ConnectError as cause', () => {
      const connectError = createConnectError('Connection refused', mockRequest);
      try {
        throwConnectError(connectError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(connectError);
        }
      }
    });
  });

  describe('extractConnectError', () => {
    it('should extract ConnectError from Error', () => {
      const originalError = createConnectError('Connection refused', mockRequest);
      try {
        throwConnectError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractConnectError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without ConnectError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractConnectError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractConnectError('string')).toBeNull();
      expect(extractConnectError(123)).toBeNull();
      expect(extractConnectError(null)).toBeNull();
      expect(extractConnectError(undefined)).toBeNull();
    });
  });

  describe('inheritance from TransferError', () => {
    it('should extend TransferError structure', () => {
      const error = createConnectError('Connection refused', mockRequest);
      // ConnectError should have all TransferError properties
      expect(error.type).toBe('ConnectError');
      expect(error.message).toBeDefined();
      expect(error.request).toBeDefined();
      expect(error.stack).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: ConnectError = createConnectError('Connection refused', mockRequest);

      // TypeScript prevents these assignments at compile time
      expect(error.type).toBe('ConnectError');
      expect(error.message).toBe('Connection refused');

      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
    });
  });
});
