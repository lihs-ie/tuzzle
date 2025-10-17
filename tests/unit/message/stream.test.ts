import { describe, it, expect } from 'vitest';
import { HttpBodyStream, streamToString, getSize, isReadable } from '../../../src/message/stream';

describe('HttpBodyStream', () => {
  it('should create stream from string content', () => {
    const stream = HttpBodyStream('hello world');

    expect(stream.content).toBe('hello world');
    expect(stream.size).toBe(11);
    expect(stream.isReadable).toBe(true);
  });

  it('should create stream from null content', () => {
    const stream = HttpBodyStream(null);

    expect(stream.content).toBeNull();
    expect(stream.size).toBeNull();
    expect(stream.isReadable).toBe(false);
  });

  it('should create stream from Blob', () => {
    const blob = new Blob(['test'], { type: 'text/plain' });
    const stream = HttpBodyStream(blob);

    expect(stream.content).toBe(blob);
    expect(stream.size).toBe(4);
    expect(stream.isReadable).toBe(true);
  });

  it('should create stream from ReadableStream', () => {
    const readableStream = new ReadableStream();
    const stream = HttpBodyStream(readableStream);

    expect(stream.content).toBe(readableStream);
    expect(stream.size).toBeNull();
    expect(stream.isReadable).toBe(true);
  });
});

describe('streamToString', () => {
  it('should convert string content to string', async () => {
    const stream = HttpBodyStream('hello');
    const result = await streamToString(stream);

    expect(result).toBe('hello');
  });

  it('should convert null content to empty string', async () => {
    const stream = HttpBodyStream(null);
    const result = await streamToString(stream);

    expect(result).toBe('');
  });

  it('should convert Blob to string', async () => {
    const blob = new Blob(['blob content']);
    const stream = HttpBodyStream(blob);
    const result = await streamToString(stream);

    expect(result).toBe('blob content');
  });

  it('should convert ReadableStream to string', async () => {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('chunk1'));
        controller.enqueue(encoder.encode('chunk2'));
        controller.close();
      },
    });

    const stream = HttpBodyStream(readableStream);
    const result = await streamToString(stream);

    expect(result).toBe('chunk1chunk2');
  });
});

describe('getSize', () => {
  it('should return size for string content', () => {
    const stream = HttpBodyStream('test');
    expect(getSize(stream)).toBe(4);
  });

  it('should return null for null content', () => {
    const stream = HttpBodyStream(null);
    expect(getSize(stream)).toBeNull();
  });

  it('should return size for Blob', () => {
    const blob = new Blob(['12345']);
    const stream = HttpBodyStream(blob);
    expect(getSize(stream)).toBe(5);
  });

  it('should return null for ReadableStream', () => {
    const readableStream = new ReadableStream();
    const stream = HttpBodyStream(readableStream);
    expect(getSize(stream)).toBeNull();
  });
});

describe('isReadable', () => {
  it('should return true for string content', () => {
    const stream = HttpBodyStream('test');
    expect(isReadable(stream)).toBe(true);
  });

  it('should return false for null content', () => {
    const stream = HttpBodyStream(null);
    expect(isReadable(stream)).toBe(false);
  });

  it('should return true for Blob', () => {
    const blob = new Blob(['test']);
    const stream = HttpBodyStream(blob);
    expect(isReadable(stream)).toBe(true);
  });

  it('should return true for ReadableStream', () => {
    const readableStream = new ReadableStream();
    const stream = HttpBodyStream(readableStream);
    expect(isReadable(stream)).toBe(true);
  });
});
