import { describe, it } from 'vitest';
import { expectTypeOf } from 'vitest';
import type { RequestOptions, MultipartItem, TransferStats } from '../../src/handler/stack';
import { HttpRequest } from '../../src/message/request';
import { HttpResponse } from '../../src/message/response';
import { Method } from '../../src/method';

describe('RequestOptions型', () => {
  it('should accept all valid option types', () => {
    // 全てのオプションが正しく型付けされることを確認
    const options: RequestOptions = {
      allowRedirects: true,
      auth: ['user', 'pass', 'basic'] as const,
      body: 'string body',
      cert: 'path/to/cert',
      cookies: true,
      connectTimeout: 1000,
      timeout: 5000,
      readTimeout: 3000,
      cryptoMethod: 'TLS',
      debug: true,
      decodeContent: true,
      delay: 500,
      expect: true,
      forceIpResolve: 'v4',
      formParams: { key: 'value' },
      headers: { 'Content-Type': 'application/json' },
      httpErrors: true,
      idnConversion: true,
      json: { data: 'test' },
      proxy: 'http://proxy:8080',
      query: { page: '1' },
      sink: 'output.txt',
      sslKey: 'path/to/key',
      stream: true,
      synchronous: true,
      verify: true,
      version: '1.1',
    };

    expectTypeOf(options).toMatchTypeOf<RequestOptions>();
  });

  it('should accept allowRedirects as boolean', () => {
    const options: RequestOptions = {
      allowRedirects: false,
    };

    // 型が正しく推論されることを確認（コンパイルエラーがなければOK）
    expectTypeOf(options).toMatchTypeOf<RequestOptions>();
  });

  it('should accept allowRedirects as detailed config', () => {
    const options: RequestOptions = {
      allowRedirects: {
        max: 5,
        strict: true,
        referer: true,
        protocols: ['http', 'https'],
        onRedirect: (previous: string, next: string) => {
          console.log(`Redirect from ${previous} to ${next}`);
        },
      },
    };

    expectTypeOf(options).toMatchTypeOf<RequestOptions>();
  });

  it('should accept auth tuple', () => {
    const options: RequestOptions = {
      auth: ['username', 'password', 'digest'],
    };

    expectTypeOf(options).toMatchTypeOf<RequestOptions>();
  });

  it('should accept body as string, Blob, or ReadableStream', () => {
    const options1: RequestOptions = { body: 'string' };
    const options2: RequestOptions = { body: new Blob() };
    const options3: RequestOptions = { body: new ReadableStream() };
    const options4: RequestOptions = { body: null };

    expectTypeOf(options1).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options2).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options3).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options4).toMatchTypeOf<RequestOptions>();
  });

  it('should accept proxy as string or detailed config', () => {
    const options1: RequestOptions = {
      proxy: 'http://proxy:8080',
    };

    const options2: RequestOptions = {
      proxy: {
        http: 'http://proxy:8080',
        https: 'https://secure-proxy:8443',
        no: ['localhost', '127.0.0.1'],
      },
    };

    expectTypeOf(options1).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options2).toMatchTypeOf<RequestOptions>();
  });

  it('should accept query as Record or string', () => {
    const options1: RequestOptions = {
      query: { page: '1', limit: '10' },
    };

    const options2: RequestOptions = {
      query: 'page=1&limit=10',
    };

    expectTypeOf(options1).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options2).toMatchTypeOf<RequestOptions>();
  });

  it('should accept json as unknown type', () => {
    const options1: RequestOptions = {
      json: { key: 'value' },
    };

    const options2: RequestOptions = {
      json: ['array', 'of', 'values'],
    };

    const options3: RequestOptions = {
      json: 'string value',
    };

    expectTypeOf(options1).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options2).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options3).toMatchTypeOf<RequestOptions>();
  });

  it('should accept callbacks', () => {
    const options: RequestOptions = {
      onHeaders: (response: HttpResponse) => {
        console.log('Headers received:', response.headers);
      },
      onStats: (stats: TransferStats) => {
        console.log('Transfer time:', stats.transferTime);
      },
      progress: (downloadTotal, downloadNow, uploadTotal, uploadNow) => {
        console.log(`Download: ${downloadNow}/${downloadTotal}`);
        console.log(`Upload: ${uploadNow}/${uploadTotal}`);
      },
    };

    expectTypeOf(options).toMatchTypeOf<RequestOptions>();
  });

  it('should accept HTTP version', () => {
    const options1: RequestOptions = { version: '1.0' };
    const options2: RequestOptions = { version: '1.1' };
    const options3: RequestOptions = { version: '2.0' };
    const options4: RequestOptions = { version: '3.0' };

    expectTypeOf(options1).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options2).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options3).toMatchTypeOf<RequestOptions>();
    expectTypeOf(options4).toMatchTypeOf<RequestOptions>();
  });
});

describe('MultipartItem型', () => {
  it('should accept multipart item structure', () => {
    const item: MultipartItem = {
      name: 'file',
      contents: 'file contents',
      filename: 'test.txt',
      headers: {
        'Content-Type': 'text/plain',
      },
    };

    expectTypeOf(item).toMatchTypeOf<MultipartItem>();
    expectTypeOf(item.name).toMatchTypeOf<string>();
    expectTypeOf(item.contents).toMatchTypeOf<string | Blob | ReadableStream<Uint8Array>>();
  });
});

describe('TransferStats型', () => {
  it('should accept transfer stats structure', () => {
    const dummyRequest = HttpRequest(Method.GET, 'https://example.com');

    const dummyResponse = HttpResponse(200, {
      reasonPhrase: 'OK',
    });

    const stats: TransferStats = {
      request: dummyRequest,
      response: dummyResponse,
      transferTime: 150,
      error: null,
    };

    expectTypeOf(stats).toMatchTypeOf<TransferStats>();
    expectTypeOf(stats.request).toMatchTypeOf<HttpRequest>();
    expectTypeOf(stats.response).toMatchTypeOf<HttpResponse | null>();
    expectTypeOf(stats.transferTime).toMatchTypeOf<number>();
    expectTypeOf(stats.error).toMatchTypeOf<Error | null>();
  });
});
