/**
 * HTTP ボディストリームの型定義と操作関数
 */

type StreamContent = string | Blob | ReadableStream<Uint8Array> | null;

/**
 * HTTP ボディストリームの型
 */
export type HttpBodyStream = {
  readonly content: StreamContent;
  readonly size: number | null;
  readonly isReadable: boolean;
};

/**
 * ボディストリームを生成する
 *
 * @param content - ストリームのコンテンツ（string | Blob | ReadableStream | null）
 * @returns 新しい HttpBodyStream オブジェクト
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
 * ストリームを文字列に変換する
 *
 * @param stream - 変換対象のストリーム
 * @returns 文字列化されたコンテンツ
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
 * ストリームのサイズを取得する
 *
 * @param stream - サイズ取得対象のストリーム
 * @returns ストリームのサイズ（バイト単位）。不明な場合は null
 */
export const getSize = (stream: HttpBodyStream): number | null => stream.size;

/**
 * ストリームが読み取り可能かチェックする
 *
 * @param stream - チェック対象のストリーム
 * @returns 読み取り可能な場合は true
 */
export const isReadable = (stream: HttpBodyStream): boolean => stream.isReadable;
