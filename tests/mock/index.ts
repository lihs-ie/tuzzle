/**
 * テスト支援機能の統合エクスポート
 * モックハンドラー、ヒストリーミドルウェア、レスポンスヘルパーを提供
 */

// モックハンドラー
export {
  createMockHandler,
  getLastRequest,
  getLastOptions,
  countMockQueue,
  resetMockQueue,
  appendMockQueue,
} from './handler.js';
export type { MockItem } from './handler.js';

// ヒストリーミドルウェア
export { createHistoryMiddleware, clearHistory, getLastHistoryEntry } from './history.js';
export type { HistoryEntry, HistoryContainer } from './history.js';

// レスポンスヘルパー
export { mockResponse, mockJsonResponse, mockErrorResponse } from './queue.js';
