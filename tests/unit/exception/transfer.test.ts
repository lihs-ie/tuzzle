import { describe, it, expect } from 'vitest';
import {
  createTransferError,
  isTransferError,
  throwTransferError,
  extractTransferError,
} from '../../../src/exception/transfer.js';
import type { TransferError } from '../../../src/exception/transfer.js';
import type { HttpRequest } from '../../../src/message/request.js';
import { HttpRequest as createHttpRequest } from '../../../src/message/request.js';

describe('TransferError', () => {
  const mockRequest: HttpRequest = createHttpRequest('GET', 'https://example.com/api');

  describe('createTransferError', () => {
    it('should create TransferError with message and request', () => {
      const error = createTransferError('Transfer failed', mockRequest);
      expect(error.type).toBe('TransferError');
      expect(error.message).toBe('Transfer failed');
      expect(error.request).toBe(mockRequest);
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create TransferError with cause', () => {
      const cause = new Error('Network error');
      const error = createTransferError('Transfer failed', mockRequest, { cause });
      expect(error.type).toBe('TransferError');
      expect(error.cause).toBe(cause);
    });

    it('should create TransferError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createTransferError('Transfer failed', mockRequest, { stack: customStack });
      expect(error.stack).toBe(customStack);
    });
  });

  describe('isTransferError', () => {
    it('should return true for TransferError', () => {
      const error = createTransferError('Transfer failed', mockRequest);
      expect(isTransferError(error)).toBe(true);
    });

    it('should return false for non-TransferError objects', () => {
      const plainError = new Error('Plain error');
      expect(isTransferError(plainError)).toBe(false);
      expect(isTransferError({ message: 'Not an error' })).toBe(false);
      expect(isTransferError(null)).toBe(false);
      expect(isTransferError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = { type: 'WrongType', message: 'Fake', request: mockRequest };
      expect(isTransferError(fakeError)).toBe(false);
    });

    it('should return false for TuzzleError', () => {
      const tuzzleError = { type: 'TuzzleError', message: 'Base error' };
      expect(isTransferError(tuzzleError)).toBe(false);
    });
  });

  describe('throwTransferError', () => {
    it('should throw standard Error', () => {
      const transferError = createTransferError('Transfer failed', mockRequest);
      expect(() => throwTransferError(transferError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const transferError = createTransferError('Transfer failed', mockRequest);
      expect(() => throwTransferError(transferError)).toThrow('Transfer failed');
    });

    it('should attach TransferError as cause', () => {
      const transferError = createTransferError('Transfer failed', mockRequest);
      try {
        throwTransferError(transferError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(transferError);
        }
      }
    });
  });

  describe('extractTransferError', () => {
    it('should extract TransferError from Error', () => {
      const originalError = createTransferError('Transfer failed', mockRequest);
      try {
        throwTransferError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractTransferError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without TransferError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractTransferError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractTransferError('string')).toBeNull();
      expect(extractTransferError(123)).toBeNull();
      expect(extractTransferError(null)).toBeNull();
      expect(extractTransferError(undefined)).toBeNull();
    });
  });

  describe('inheritance from TuzzleError', () => {
    it('should extend TuzzleError structure', () => {
      const error = createTransferError('Transfer failed', mockRequest);
      // TransferError should have all TuzzleError properties
      expect(error.type).toBe('TransferError');
      expect(error.message).toBeDefined();
      expect(error.stack).toBeDefined();
    });

    it('should include request property', () => {
      const error = createTransferError('Transfer failed', mockRequest);
      expect(error.request).toBe(mockRequest);
      expect(error.request.method).toBe('GET');
      expect(error.request.uri).toBe('https://example.com/api');
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: TransferError = createTransferError('Transfer failed', mockRequest);

      // TypeScript prevents these assignments at compile time
      expect(error.type).toBe('TransferError');
      expect(error.message).toBe('Transfer failed');

      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
      // @ts-expect-error - readonly property cannot be assigned
      error.request = createHttpRequest('POST', 'https://other.com');
    });
  });
});
