/**
 * 使用可能な HTTP メソッドの集合
 */
export const Method = {
  GET: 'GET',
  HEAD: 'HEAD',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  CONNECT: 'CONNECT',
  OPTIONS: 'OPTIONS',
  TRACE: 'TRACE',
  PATCH: 'PATCH',
} as const;

export type Method = (typeof Method)[keyof typeof Method];
