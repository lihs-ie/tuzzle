import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Tuzzle',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // 外部依存関係として扱う（バンドルに含めない）
      external: [],
      output: {
        // Tree-shakingを最適化
        preserveModules: false,
        exports: 'named',
      },
    },
    sourcemap: true,
    target: 'es2020',
    minify: false, // 型定義の可読性のためminifyしない
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/', 'docs/', 'references/', '*.config.*'],
    },
  },
});
