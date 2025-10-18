# コードベース構造

## ディレクトリ構成

```
src/
├── index.ts              # 公開 API エントリーポイント
├── client.ts             # HttpClient 実装
├── method.ts             # HTTP メソッド定数
├── handler/              # リクエスト実行ハンドラー
│   ├── fetch.ts              # fetch API ベースのデフォルトハンドラー
│   ├── stack.ts              # ミドルウェアチェーン管理、RequestOptions型定義
│   └── index.ts              # 再エクスポート用
├── middleware/           # ミドルウェア実装
│   └── index.ts              # 再エクスポート用
├── message/              # PSR-7 相当のメッセージ型
│   ├── request.ts            # HttpRequest 型定義と関数
│   ├── response.ts           # HttpResponse 型定義と関数
│   ├── headers.ts            # HttpHeaders 型定義と関数
│   ├── stream.ts             # HttpBodyStream 型定義と関数
│   └── index.ts              # 再エクスポート用
├── cookie/               # Cookie 管理
│   ├── set.ts                # SetCookie パーサー関数（RFC 6265準拠）
│   ├── jar.ts                # CookieJar 型定義と関数
│   └── index.ts              # 再エクスポート用
└── exception/            # エラー型定義（未実装）
    └── index.ts              # 再エクスポート用

tests/
├── unit/                 # 単体テスト
│   ├── handler/              # ハンドラー単体テスト
│   ├── middleware/           # ミドルウェア単体テスト
│   ├── message/              # メッセージ型単体テスト
│   └── cookie/               # Cookie管理単体テスト
├── integration/          # 統合テスト
│   └── handler/              # ハンドラー統合テスト
└── mock/                 # テスト支援・モック機能（未実装）

docs/                     # ドキュメント
├── tickets/                  # 実装チケット
└── guzzle-parity-checklist.md # GuzzleHTTP互換性チェックリスト

references/guzzle/        # GuzzleHTTP リファレンス
```

## ディレクトリ命名規則
- ディレクトリ名は複数形で機能領域を表現 (`handler/`, `middleware/`, `exception/`)
- 各ディレクトリに `index.ts` で再エクスポートを提供

## 重要ファイル
- `src/handler/stack.ts` - RequestOptions型定義（50+のオプション）、ハンドラースタック管理
- `src/client.ts` - HttpClient実装、mergeOptions関数
- `src/cookie/set.ts` - SetCookieパーサー（RFC 6265準拠）
- `src/cookie/jar.ts` - CookieJar実装
