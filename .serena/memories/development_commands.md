# 開発コマンド

## セットアップ

```bash
pnpm install              # 初回セットアップ・依存関係インストール
```

## 開発

```bash
pnpm dev                  # 開発サーバー起動
pnpm test:watch           # テストウォッチモード
```

## テスト

```bash
pnpm test                 # 全テスト実行 (Vitest)
pnpm test:watch           # テストウォッチモード
pnpm vitest run tests/unit/example.test.ts  # 特定のテスト実行
```

## 型チェック

```bash
pnpm type-check           # 型チェック (tsc --noEmit)
```

## リント・フォーマット

```bash
pnpm lint                 # ESLint + Prettier チェック (--max-warnings=0)
pnpm lint:fix             # ESLint 自動修正
pnpm format               # Prettier チェック
pnpm format:write         # Prettier 自動整形
```

## ビルド

```bash
pnpm build                # フルビルド (clean + bundle + types)
pnpm build:bundle         # Vite でバンドル
pnpm build:types          # 型定義ファイルのみ生成
pnpm clean                # dist ディレクトリクリーンアップ
```

## Git コマンド

```bash
git status                # Git 状態確認
git add .                 # すべての変更をステージング
git commit -m "message"   # コミット
```

## システムユーティリティ (Darwin/macOS)

- `ls -la` - ファイル一覧表示
- `cd <directory>` - ディレクトリ移動
- `grep -r "pattern" .` - 再帰的検索
- `find . -name "*.ts"` - ファイル検索
