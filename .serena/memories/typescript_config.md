# TypeScript 設定

## 厳格な型安全性

- **strict モード有効** - 最も厳格な型チェック
- **`as any`, `as unknown` は禁止** - 型推論・ジェネリクス・型ガードで解決
- **`noUncheckedIndexedAccess: true`** - インデックスアクセスは `| undefined` を考慮
- `target: ESNext`
- `module: ESNext`
- `moduleResolution: Bundler`
- Vitest グローバル型を有効化 (`types: ["vitest/globals"]`)

## tsconfig.json の主要設定

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "lib": ["ESNext", "DOM"],
    "types": ["vitest/globals"]
  }
}
```

## 型安全性の原則

- 型推論を最大限活用
- ジェネリクスで柔軟性を確保
- 型ガードで実行時の型安全性を保証
- 型アサーション禁止
