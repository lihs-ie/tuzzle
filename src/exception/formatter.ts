/**
 * Error message formatter
 * Generates messages containing detailed information about HTTP errors
 */

import type { HttpRequest } from '../message/request.js';
import type { HttpResponse } from '../message/response.js';
import type { HttpBodyStream } from '../message/stream.js';

const DEFAULT_MAX_BODY_LENGTH = 120;

/**
 * Formats an HTTP error message
 *
 * @param baseMessage - Base error message
 * @param request - HTTP request
 * @param response - HTTP response (may be null)
 * @returns Formatted error message
 *
 * @example
 * ```typescript
 * const message = formatErrorMessage('Request failed', request, response);
 * // "Request failed: GET https://example.com/api - 404 Not Found"
 * ```
 */
export const formatErrorMessage = (
  baseMessage: string,
  request: HttpRequest,
  response: HttpResponse | null,
): string => {
  const parts: string[] = [baseMessage];

  // Add request information
  parts.push(`${request.method} ${request.uri}`);

  // Add response information (if exists)
  if (response) {
    parts.push(`${response.statusCode} ${response.reasonPhrase}`);

    // Add body summary
    const bodySummary = summarizeBodyStream(response.body);
    if (bodySummary) {
      parts.push(`Body: ${bodySummary}`);
    }
  }

  return parts.join(' - ');
};

/**
 * Extracts and summarizes a string from HttpBodyStream
 *
 * @param bodyStream - HttpBodyStream (may be null)
 * @param maxLength - Maximum length (default: 120)
 * @returns Summarized body string
 *
 * @example
 * ```typescript
 * const summary = summarizeBodyStream(response.body);
 * ```
 */
export const summarizeBodyStream = (
  bodyStream: HttpBodyStream | null,
  maxLength: number = DEFAULT_MAX_BODY_LENGTH,
): string => {
  if (!bodyStream || bodyStream.content === null) {
    return '';
  }

  // Only summarize strings (don't handle Blob or ReadableStream)
  if (typeof bodyStream.content === 'string') {
    return summarizeBody(bodyStream.content, maxLength);
  }

  return '';
};

/**
 * Summarizes a response body
 * Long bodies are truncated and HTML tags are removed
 *
 * @param body - Response body
 * @param maxLength - Maximum length (default: 120)
 * @returns Summarized body string
 *
 * @example
 * ```typescript
 * const summary = summarizeBody('<html><body>Error</body></html>');
 * // "Error"
 *
 * const longSummary = summarizeBody('a'.repeat(200), 50);
 * // "aaa...aaa" (50 characters + "...")
 * ```
 */
export const summarizeBody = (
  body: string | null | undefined,
  maxLength: number = DEFAULT_MAX_BODY_LENGTH,
): string => {
  if (!body) {
    return '';
  }

  // Treat strings with only whitespace as empty strings
  const trimmed = body.trim();
  if (!trimmed) {
    return '';
  }

  let processed = trimmed;

  // Remove HTML tags
  processed = processed.replace(/<[^>]*>/g, '');

  // Convert consecutive whitespace to single space
  processed = processed.replace(/\s+/g, ' ');

  // Trim again
  processed = processed.trim();

  // Truncate to maximum length
  if (processed.length > maxLength) {
    return processed.slice(0, maxLength) + '...';
  }

  return processed;
};
