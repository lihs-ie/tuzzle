# コーディングスタイルと規約

## プログラミングパラダイム

### 関数型プログラミング原則（厳守）

#### クラスの使用禁止
すべてを関数と型定義で実装すること。

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

#### Immutable 実装
- すべてのデータ構造を不変にし、更新は新しいオブジェクトを返すこと
- オブジェクトの更新は `{ ...obj, newProp: value }` で実現
- 配列の更新は `[...arr, newItem]` や `arr.filter(...)` で実現

#### 関数型アプローチ
- 純粋関数を優先 (副作用を最小限に)
- パイプライン処理やコンポジションを活用
- `map`, `filter`, `reduce` などの高階関数を使用

## 命名規則

- **型・インターフェース**: PascalCase
- **関数・変数**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **略語の禁止**: 多数の人が共通認識で理解できる略語以外は略さない
  - OK: `URL`, `UUID`, `ULID`
  - NG: `userRepo` → `userRepository`, `req` → `request`, `res` → `response`

## ハードコードの絶対禁止

### マジックナンバー禁止
```typescript
// NG
if (age > 20)

// OK
const ADULT_AGE = 20;
if (age > ADULT_AGE)
```

### 設定値の外部化
API キー、URL、ファイルパスは設定ファイルや環境変数から読み込むこと。

## ESLint 無視の禁止
`eslint-disable`、`eslint-disable-line`、`eslint-disable-next-line` の使用は絶対禁止。
ESLint警告はコードを修正して解決すること。

## その他の規約

- **単一責任の原則**: 一つのモジュール・関数は一つの責務のみ
- **DRY原則**: コードの重複を避ける
- **明確な命名**: 目的と意図が伝わる命名
- **ガード節**: 深いネストを避け、早期リターンを使用
- **TSDoc必須**: 公開APIには必ず付与

## スタイル

- インデント: 2スペース
- ESLint + Prettier で自動整形
