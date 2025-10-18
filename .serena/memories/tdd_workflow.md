# TDD ワークフロー

## レッド・グリーン・リファクタリング・コミット

### フェーズ 1: レッド - 失敗するテストを書く
- 実装前に具体的で失敗するテストを作成
- テストは必ず失敗（レッド）すること

### フェーズ 2: グリーン - テストをパスさせる
- テストをパスさせるための**最小限のコード**を記述
- 余分な機能は追加しない
- テストをグリーンにすることだけを考える

### フェーズ 3: リファクタリング - 設計を改善する
- テストが通っている状態を維持しながらコード品質を向上
- 重複の排除（DRY原則）
- 命名の明確化
- 複雑なロジックの単純化
- コーディング規約の確認
- **条件**: すべてのテストはグリーンを維持
  - テストスキップは禁止
  - テストを成功させるための別テストファイル作成は禁止

### フェーズ 4: コミット - 進捗を保存する
- リファクタリング完了後、全テストグリーンを確認
- `git add .` で変更をステージング
- Conventional Commits形式でコミット

## タスク完了前の必須チェック

1. **型チェック**: `pnpm type-check` が成功
2. **テスト**: `pnpm test` がすべて成功
3. **リント**: `pnpm lint` が成功 (--max-warnings=0)
4. **フォーマット**: `pnpm format` が成功

## コミット規約

Conventional Commits 形式:
- `feat: add request retry middleware`
- `fix: resolve timeout race condition`
- `test: add unit tests for cookie parser`
- `refactor: simplify header parsing logic`
- `docs: update API documentation`

1コミット = 1論点

## 要件定義管理

- 実装前に **REQUIREMENTS_DEFINITION.md** に要件をまとめる
- すべて完了後にファイルをクリア
