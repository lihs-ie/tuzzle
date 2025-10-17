# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

tuzzle は GuzzleHTTP にインスパイアされた TypeScript 製の型安全 HTTP クライアントライブラリです。ミドルウェアシステムを中心とした拡張可能なアーキテクチャで、Node.js 環境での HTTP 通信を提供します。

## 開発コマンド

依存関係管理には **pnpm** を必ず使用してください:

```bash
pnpm install              # 初回セットアップ
pnpm type-check           # 型チェック (tsc --noEmit)
pnpm test                 # テスト実行 (Vitest)
pnpm test:watch           # テストウォッチモード
pnpm lint                 # ESLint + Prettier チェック
pnpm lint:fix             # 自動修正
pnpm format               # Prettier チェック
pnpm format:write         # Prettier 自動整形
pnpm build                # フルビルド (clean + bundle + types)
pnpm build:bundle         # Vite でバンドル
pnpm build:types          # 型定義ファイルのみ生成
```

単体テストを実行する場合は `vitest` を直接使用することもできます:

```bash
pnpm vitest run tests/unit/example.test.ts  # 特定のテストファイルを実行
```

## アーキテクチャと構成

### ディレクトリ構造

```
src/
├── index.ts              # 公開 API エントリーポイント
├── client.ts             # HttpClient 実装と RequestOptions 型定義
├── method.ts             # HTTP メソッド定数
├── handler/              # リクエスト実行ハンドラー
│   ├── fetch.ts              # fetch API ベースのデフォルトハンドラー
│   ├── stack.ts              # ミドルウェアチェーン管理
│   └── index.ts              # 再エクスポート用
├── middleware/           # ミドルウェア実装
│   ├── redirect.ts           # リダイレクト処理
│   ├── retry.ts              # リトライ処理
│   ├── prepare-body.ts       # リクエストボディの準備
│   ├── cookies.ts            # Cookie 管理
│   ├── http-errors.ts        # HTTP エラーハンドリング
│   └── index.ts              # 再エクスポート用
├── message/              # PSR-7 相当のメッセージ型
│   ├── request.ts            # HttpRequest 型定義と関数
│   ├── response.ts           # HttpResponse 型定義と関数
│   ├── headers.ts            # HttpHeaders 型定義と関数
│   └── stream.ts             # HttpBodyStream 型定義と関数
|   └── index.ts              # 再エクスポート用
├── cookie/               # Cookie 管理
│   ├── jar.ts                # CookieJar 型定義と関数
│   └── set.ts                # SetCookie パーサー関数
|   └── index.ts              # 再エクスポート用
└── exception/            # エラー型定義
    ├── tuzzle.ts             # 基底例外
    ├── request.ts            # リクエストエラー
    ├── connect.ts            # 接続エラー
    ├── client.ts             # 4xx エラー
    └── server.ts             # 5xx エラー
    └── index.ts              # 再エクスポート用

tests/
├── unit/                 # 単体テスト
├── integration/          # 統合テスト
└── mock/                 # テスト支援・モック機能
    ├── handler.ts            # モックハンドラー
    ├── history.ts            # リクエスト履歴記録
    └── queue.ts              # モックレスポンスキュー

examples/                 # 使用例
docs/                     # ドキュメント
references/guzzle/        # GuzzleHTTP リファレンス
```

**設計原則**:

- 各ファイルは単一の責務を持ち、型定義は実装と同じファイル内で定義
- ディレクトリ名は複数形で機能領域を表現 (`handler/`, `middleware/`, `exception/`)
- Guzzle の構造に準拠し、対応関係を明確化

### コア型定義

現在の主要な型定義 (`src/client.ts`):

- `RequestOptions<Body, Headers, FormParams, Query>` - リクエスト設定のジェネリック型
  - GuzzleHTTP 互換のオプション群 (auth, timeout, headers, allowRedirects, etc.)
- `HttpClient` - HTTP クライアントインターフェース
  - `request<T>()` - 汎用リクエストメソッド
  - HTTP メソッド別のショートカット (`get`, `post`, `put`, `delete`, `patch`, `head`, `options`)

`src/method.ts` で HTTP メソッド定数を定義しています。

### Guzzle パリティ戦略

`docs/guzzle-parity-checklist.md` に GuzzleHTTP との機能互換チェックリストがあります。主要実装項目:

1. **PSR-7 相当のメッセージ表現** - イミュータブルな `HttpRequest`, `HttpResponse`, `HttpHeaders`, `HttpBodyStream`
2. **ハンドラースタック** - ミドルウェアチェーンによる拡張可能なアーキテクチャ
3. **リクエストオプション** - 50+ のオプション項目 (allowRedirects, auth, cookies, timeout, proxy, etc.)
4. **エラーハンドリング** - HTTP ステータス・トランスポートエラー別の専用例外型
5. **テスト支援** - モックハンドラー、ヒストリーミドルウェア

新機能を追加する際は、このチェックリストを参照して GuzzleHTTP の挙動と整合させてください。

## TypeScript 設定

厳格な型安全性を重視しています:

- **strict モード有効** (`tsconfig.json`)
- **`as any`, `as unknown` は禁止** - 型推論・ジェネリクス・型ガードで解決すること
- **`noUncheckedIndexedAccess: true`** - インデックスアクセスは常に `| undefined` を考慮
- `target: ESNext`, `module: ESNext`, `moduleResolution: Bundler`
- Vitest グローバル型を有効化 (`types: ["vitest/globals"]`)

## プログラミングパラダイム

**関数型プログラミング原則を厳守**:

- **クラスの使用禁止** - すべてを関数と型定義で実装すること
- **Immutable 実装** - すべてのデータ構造を不変にし、更新は新しいオブジェクトを返すこと
- **関数型アプローチ**:
  - 純粋関数を優先 (副作用を最小限に)
  - パイプライン処理やコンポジションを活用
  - `map`, `filter`, `reduce` などの高階関数を使用
  - オブジェクトの更新は `{ ...obj, newProp: value }` で実現
  - 配列の更新は `[...arr, newItem]` や `arr.filter(...)` で実現

**例**:

```typescript
// NG: クラスの使用
class HttpRequest {
  constructor(private url: string) {}
  withHeader(key: string, value: string) {
    this.headers[key] = value; // ミューテーション
  }
}

// OK: 関数と immutable 更新
type HttpRequest = {
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
};

const withHeader = (request: HttpRequest, key: string, value: string): HttpRequest => ({
  ...request,
  headers: { ...request.headers, [key]: value },
});
```

## コーディング規約

### 命名規則 (AGENTS.md より)

- **クラス・インターフェース**: PascalCase
- **関数・変数**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **略語の禁止**: 多数の人が共通認識で理解できる略語以外は略さない
  - OK: `URL`, `UUID`, `ULID`
  - NG: `userRepo` → `userRepository`, `req` → `request`, `res` → `response`, `GC_TIME` → `GARBAGE_COLLECTION_TIME`

### スタイル

- インデント: 2 スペース
- TSDoc を公開 API に必須で付与 (目的・パラメーター・戻り値・例外)
- ESLint (`@typescript-eslint`) + Prettier で自動整形

## テストガイドライン

- テストは `tests/` または `src/**/__tests__/` に配置
- ファイル名: `*.test.ts` または `*.spec.ts`
- Vitest の `describe` でグルーピング、`it` で期待動作を明記
- HTTP 通信は `msw` または `nock` でモック
- 型の回帰は `expectTypeOf` で保証
- 最低限の分岐網羅を確保し、バグ修正時は再発防止テストを追加

## コミット規約

- **Conventional Commits** 形式:
  - `feat: add request retry middleware`
  - `fix: resolve timeout race condition`
- 1 コミット = 1 論点
- コミット前に `pnpm type-check` を必ず通過させること
- PR には目的・変更内容・テスト結果を記載
- 関連 Issue は `Closes #<番号>` でリンク

## セキュリティ

- API トークン・顧客データをリポジトリに含めない
- 環境変数は `.env.example` にダミー値を定義し、実値はローカル・CI シークレットで管理
- `pnpm audit` と `pnpm outdated` で依存パッケージを定期確認
- 破壊的変更は CHANGELOG に記載

## 開発ワークフロー

### Conversation Guidelines

- 常に日本語で会話する

### 要件定義を REQUIREMENTS_DEFINITION.md にまとめる

- 実装・修正を開始する前に**必ず**要件定義を /REQUIREMENTS_DEFINITION.md にまとめること
- 全ての要件が達成された後にこの md ファイルをクリアにすること

## 1. 基本哲学: テスト駆動

- **テストが開発を駆動する:** すべてのプロダクションコードは、失敗するテストをパスさせるためだけに書かれます。テストは後付けの作業ではありません。それ自身が仕様書であり、設計の駆動役です。
- **リファクタリングへの自信:** 包括的なテストスイートは我々のセーフティネットです。これにより、私たちは恐れることなく継続的にコードベースのリファクタリングと改善を行えます。
- **テスト容易性は良い設計に等しい:** コードがテストしにくい場合、それは悪い設計の兆候です。エージェントは、テスト容易性の高いコード作成を最優先しなければなりません。それは自然と、疎結合で凝集度の高いアーキテクチャにつながります。

## 2. 開発サイクル: レッド・グリーン・リファクタリング・コミット

エージェントは、いかに小さな変更であっても、必ずこの反復的なサイクルに従わなければなりません。コードを生成する際は、現在どのフェーズにいるのかを明示してください。

### フェーズ 1: レッド - 失敗するテストを書く

- **目的:** これから何を達成するのかを明確に定義する。
- **行動:** 実装コードを書く前に、これから実装したい単一の機能に対する、具体的で失敗するテストを一つ作成する。
- **条件:** 対応する実装がまだ存在しないため、このテストは必ず失敗（**レッド**）しなければならない。

### フェーズ 2: グリーン - テストをパスさせる

- **目的:** テストで示された要件を満たす。
- **行動:** 失敗したテストをパスさせるために必要な、**最小限のコード**を記述する。
- **条件:** この段階で余分な機能を追加しないこと。コードの美しさは追求せず、ただテストをパス（**グリーン**）させることだけを考える。

### フェーズ 3: リファクタリング - 設計を改善する

- **目的:** テストが通っている状態を維持しながら、コードの品質を向上させる。
- **行動:** テストが成功しているという安全な状態で、コードの内部構造を改善する。これには以下の作業が含まれるが、これに限定されない。
  - 重複の排除（DRY 原則）
  - 命名の明確化
  - 複雑なロジックの単純化
  - 後述のコーディング規約がすべて満たされていることの確認
- **条件:** リファクタリングの全プロセスを通じて、すべてのテストは**グリーン**の状態を維持しなければならない。
  - テストが成功しない場合テストをスキップすることは禁止する
  - テストを成功させるために単純な別のテストファイルを作成することを禁止する

### フェーズ 4: コミット - 進捗を保存する

- **目的:** 正常に動作する小さな機能単位を、安全なバージョンとして記録する。
- **行動:** リファクタリングが完了し、全テストがグリーンであることを最終確認したら、`git add .` を実行して変更をステージングする。これは、次の機能開発へ進む前の安定したチェックポイントとなる。
- **条件:** このサイクルで実装された変更が、一つの意味のあるまとまりとして完結していること。コミットメッセージもその内容を簡潔に表現すること。

## 3. 厳格なコーディング規約と禁止事項

### 【最重要】ハードコードの絶対禁止

いかなる形式のハードコードも固く禁じます。

- **マジックナンバー:** 数値リテラルをロジック内に直接記述してはならない。意味のある名前の定数を定義すること。
  - _悪い例:_ `if (age > 20)`
  - _良い例:_ `const ADULT_AGE = 20; if (age > ADULT_AGE)`
- **設定値:** API キー、URL、ファイルパス、その他の環境設定は、必ず設定ファイル（`.env`など）や環境変数から読み込むこと。ソースコード内に直接記述してはならない。
- **ユーザー向け文字列:** UI に表示するテキスト、ログ、エラーメッセージなどは、メンテナンスと国際化を容易にするため、定数や言語ファイルで管理すること。

### その他の主要な規約

- **単一責任の原則 (SRP):** 一つのモジュール、クラス、関数は、機能の一部分に対してのみ責任を持つべきである。
- **DRY (Don't Repeat Yourself):** コードの重複は絶対に避けること。共通ロジックは抽象化し、再利用する。
- **明確で意図の伝わる命名:** 変数名や関数名は、その目的と意図が明確に伝わるように命名する。
- **ガード節 / 早期リターン:** 深くネストした`if-else`構造を避け、早期リターンを積極的に利用する。
- **セキュリティ第一:** ユーザーからの入力は常に信頼しないこと。一般的な脆弱性（XSS、SQL インジェクション等）を防ぐため、入力のサニタイズと出力のエンコードを徹底する。
- **ESLint 無視の禁止:** `eslint-disable`、`eslint-disable-line`、`eslint-disable-next-line` などの ESLint ルール無視ディレクティブは絶対に使用してはならない。ESLint の警告やエラーは、コードを修正して解決すること。

## 必須環境

- Node.js >= 20.11.0
- pnpm >= 8.0.0
