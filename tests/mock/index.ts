/**
 * Integrated export of test support features
 * Provides mock handler, history middleware, and response helpers
 */

// Mock handler
export {
  createMockHandler,
  getLastRequest,
  getLastOptions,
  countMockQueue,
  resetMockQueue,
  appendMockQueue,
} from './handler.js';
export type { MockItem } from './handler.js';

// History middleware
export { createHistoryMiddleware, clearHistory, getLastHistoryEntry } from './history.js';
export type { HistoryEntry, HistoryContainer } from './history.js';

// Response helpers
export { mockResponse, mockJsonResponse, mockErrorResponse } from './queue.js';
