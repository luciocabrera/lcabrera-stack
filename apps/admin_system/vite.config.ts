import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';

import { lintConfig } from './config/vite.lint.config.ts';
import { fmtConfig } from './config/vite.fmt.config.ts';
import { runConfig } from './config/vite.run.config.ts';
import { pluginsConfig } from './config/vite.plugins.config.ts';

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
      '@repo/data-access': fileURLToPath(
        new URL('../../packages/data-access/src', import.meta.url),
      ),
      '@repo/scan-ingestion': fileURLToPath(
        new URL('../../packages/scan-ingestion/src', import.meta.url),
      ),
      '@repo/ui': fileURLToPath(
        new URL('../../packages/ui/src', import.meta.url),
      ),
    },
    tsconfigPaths: true,
  },
  run: runConfig,
  staged: {
    '*': 'vp check --fix',
  },
});
