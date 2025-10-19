/**
 * HTTP body stream type definitions and operation functions
 */

type StreamContent = string | Blob | ReadableStream<Uint8Array> | null;

/**
 * HTTP body stream type
 */
export type HttpBodyStream = {
  readonly content: StreamContent;
  readonly size: number | null;
  readonly isReadable: boolean;
};

/**
 * Creates a body stream
 *
 * @param content - Stream content (string | Blob | ReadableStream | null)
 * @returns A new HttpBodyStream object
 */
export const HttpBodyStream = (content: StreamContent): HttpBodyStream => {
  let size: number | null = null;
  let isReadableValue = false;

  if (content === null) {
    size = null;
    isReadableValue = false;
  } else if (typeof content === 'string') {
    size = new TextEncoder().encode(content).length;
    isReadableValue = true;
  } else if (content instanceof Blob) {
    size = content.size;
    isReadableValue = true;
  } else {
    // ReadableStream
    size = null;
    isReadableValue = true;
  }

  return {
    content,
    size,
    isReadable: isReadableValue,
  };
};

/**
 * Converts a stream to a string
 *
 * @param stream - Stream to convert
 * @returns Stringified content
 */
export const streamToString = async (stream: HttpBodyStream): Promise<string> => {
  const { content } = stream;

  if (content === null) {
    return '';
  }

  if (typeof content === 'string') {
    return content;
  }

  if (content instanceof Blob) {
    return await content.text();
  }

  // ReadableStream
  const reader = content.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const readResult = await reader.read();
    if (readResult.done) break;
    if (readResult.value) {
      result += decoder.decode(readResult.value, { stream: true });
    }
  }

  result += decoder.decode();
  return result;
};

/**
 * Gets the size of a stream
 *
 * @param stream - Stream to get the size of
 * @returns Stream size in bytes. Returns null if unknown
 */
export const getSize = (stream: HttpBodyStream): number | null => stream.size;

/**
 * Checks if a stream is readable
 *
 * @param stream - Stream to check
 * @returns true if the stream is readable
 */
export const isReadable = (stream: HttpBodyStream): boolean => stream.isReadable;
