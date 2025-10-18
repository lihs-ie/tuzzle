import { describe, it, expect } from 'vitest';
import {
  createTuzzleError,
  isTuzzleError,
  throwTuzzleError,
  extractTuzzleError,
} from '../../../src/exception/tuzzle.js';
import type { TuzzleError } from '../../../src/exception/tuzzle.js';

describe('TuzzleError', () => {
  describe('createTuzzleError', () => {
    it('should create basic TuzzleError with message', () => {
      const error = createTuzzleError('Test error message');
      expect(error.type).toBe('TuzzleError');
      expect(error.message).toBe('Test error message');
      expect(error.cause).toBeUndefined();
      expect(error.stack).toBeDefined();
    });

    it('should create TuzzleError with cause', () => {
      const cause = new Error('Underlying error');
      const error = createTuzzleError('Test error', { cause });
      expect(error.type).toBe('TuzzleError');
      expect(error.message).toBe('Test error');
      expect(error.cause).toBe(cause);
    });

    it('should create TuzzleError with custom stack', () => {
      const customStack = 'Custom stack trace';
      const error = createTuzzleError('Test error', { stack: customStack });
      expect(error.stack).toBe(customStack);
    });
  });

  describe('isTuzzleError', () => {
    it('should return true for TuzzleError', () => {
      const error = createTuzzleError('Test error');
      expect(isTuzzleError(error)).toBe(true);
    });

    it('should return false for non-TuzzleError objects', () => {
      const plainError = new Error('Plain error');
      expect(isTuzzleError(plainError)).toBe(false);
      expect(isTuzzleError({ message: 'Not an error' })).toBe(false);
      expect(isTuzzleError(null)).toBe(false);
      expect(isTuzzleError(undefined)).toBe(false);
    });

    it('should return false for objects with wrong type', () => {
      const fakeError = { type: 'WrongType', message: 'Fake' };
      expect(isTuzzleError(fakeError)).toBe(false);
    });
  });

  describe('throwTuzzleError', () => {
    it('should throw standard Error', () => {
      const tuzzleError = createTuzzleError('Test error');
      expect(() => throwTuzzleError(tuzzleError)).toThrow(Error);
    });

    it('should preserve message in thrown Error', () => {
      const tuzzleError = createTuzzleError('Test error message');
      expect(() => throwTuzzleError(tuzzleError)).toThrow('Test error message');
    });

    it('should preserve stack trace in thrown Error', () => {
      const tuzzleError = createTuzzleError('Test error');
      try {
        throwTuzzleError(tuzzleError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.stack).toBeDefined();
        }
      }
    });

    it('should attach TuzzleError as cause', () => {
      const tuzzleError = createTuzzleError('Test error');
      try {
        throwTuzzleError(tuzzleError);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.cause).toBe(tuzzleError);
        }
      }
    });
  });

  describe('extractTuzzleError', () => {
    it('should extract TuzzleError from Error', () => {
      const originalError = createTuzzleError('Original error');
      try {
        throwTuzzleError(originalError);
      } catch (error) {
        if (error instanceof Error) {
          const extracted = extractTuzzleError(error);
          expect(extracted).toBe(originalError);
        }
      }
    });

    it('should return null for Error without TuzzleError cause', () => {
      const plainError = new Error('Plain error');
      const extracted = extractTuzzleError(plainError);
      expect(extracted).toBeNull();
    });

    it('should return null for non-Error values', () => {
      expect(extractTuzzleError('string')).toBeNull();
      expect(extractTuzzleError(123)).toBeNull();
      expect(extractTuzzleError(null)).toBeNull();
      expect(extractTuzzleError(undefined)).toBeNull();
    });
  });

  describe('immutability', () => {
    it('should create readonly error object', () => {
      const error: TuzzleError = createTuzzleError('Test error');

      // TypeScript prevents these assignments at compile time
      // This test verifies the type definition is correctly readonly
      expect(error.type).toBe('TuzzleError');
      expect(error.message).toBe('Test error');

      // If we could assign (we can't due to TypeScript), it would be a type error
      // @ts-expect-error - readonly property cannot be assigned
      error.message = 'Modified message';
      // @ts-expect-error - readonly property cannot be assigned
      error.type = 'SomethingElse';
    });
  });
});
