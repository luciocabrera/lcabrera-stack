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
    alias: [
      {
        find: /^@\//,
        replacement: `${fileURLToPath(new URL('src', import.meta.url))}/`,
      },
      {
        find: '@lcabrera/server',
        replacement: fileURLToPath(
          new URL('../../packages/server/src', import.meta.url),
        ),
      },
      {
        find: /^@lcabrera\/ui\/(.*)$/,
        replacement: `${fileURLToPath(new URL('../../packages/ui/src', import.meta.url))}/$1`,
      },
      {
        find: /^@lcabrera\/ui$/,
        replacement: fileURLToPath(
          new URL('../../packages/ui/src/public-api.ts', import.meta.url),
        ),
      },
    ],
    tsconfigPaths: true,
  },
  run: runConfig,
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
