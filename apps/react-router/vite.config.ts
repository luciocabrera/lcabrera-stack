import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

import { fmtConfig } from './config/vite.fmt.config.ts';
import { lintConfig } from './config/vite.lint.config.ts';
import { pluginsConfig } from './config/vite.plugins.config.ts';
import { runConfig } from './config/vite.run.config.ts';

export default defineConfig({
  build: {
    // Never expose source maps in production — server code would be publicly
    // visible in the browser. The dev server has its own source map pipeline
    // that this setting does not affect.
    sourcemap: false,
  },
  fmt: fmtConfig,
  lint: lintConfig,
  plugins: pluginsConfig,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
      '@repo/api': fileURLToPath(
        new URL('../../packages/api/src', import.meta.url),
      ),
      '@repo/ui': fileURLToPath(
        new URL('../../packages/ui/src', import.meta.url),
      ),
    },
    tsconfigPaths: true,
  },
  run: runConfig,
  test: {
    // packages/ui and packages/api have no build/test infra of their own (no
    // vite.config.ts, no build step) — their test files are only reachable
    // through a consuming app's Vitest run. apps/react-router is that
    // consumer today.
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      '../../packages/ui/src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      '../../packages/api/src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
  },
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:3001',
      },
    },
  },
  staged: {
    '*': 'vp check --fix',
  },
});
