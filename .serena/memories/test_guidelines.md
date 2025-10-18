# テストガイドライン

## テストの配置

- テストは `tests/` に配置
- ファイル名: `*.test.ts` または `*.spec.ts`
- 単体テスト: `tests/unit/`
- 統合テスト: `tests/integration/`

## テストの構造

```typescript
import { describe, it, expect } from 'vitest';

describe('機能名', () => {
  it('期待動作を明記', () => {
    // Arrange: テストデータの準備
    const input = createTestInput();

    // Act: テスト対象の実行
    const result = targetFunction(input);

    // Assert: 結果の検証
    expect(result).toBe(expected);
  });
});
```

## テストツール

- **Vitest**: テストフレームワーク
  - `describe` でグルーピング
  - `it` で期待動作を明記
- **型の回帰テスト**: `expectTypeOf` で保証

## テストカバレッジ

- 最低限の分岐網羅を確保
- バグ修正時は再発防止テストを追加
- 重要な型定義には型テストを追加

## テスト実行コマンド

```bash
pnpm test                                   # 全テスト実行
pnpm test:watch                             # ウォッチモード
pnpm vitest run tests/unit/example.test.ts # 特定のテスト実行
```

## テスト禁止事項

- テストスキップ禁止
- テスト成功のための別テストファイル作成禁止
