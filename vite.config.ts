import { reactRouter } from '@react-router/dev/vite';
import stylex from '@stylexjs/unplugin';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite-plus';
import babel from 'vite-plugin-babel';

import { fixReactRouterAssets } from './utils/fixReactRouterAssets.plugin.ts';
import { lintConfig } from './vite.lint.config.ts';
import { fmtConfig } from './vite.fmt.config.ts';

const isVitestRun = process.env.VITEST === 'true';
const reactRouterPlugin = isVitestRun ? [] : [reactRouter()];

export default defineConfig({
  fmt: fmtConfig,
  lint: lintConfig,
  plugins: [
    stylex.vite({
      aliases: {
        '@/*': [fileURLToPath(new URL('src/*', import.meta.url))],
      },
      dev: process.env.NODE_ENV === 'development',
      useCSSLayers: true,
    }),
    fixReactRouterAssets(),
    ...reactRouterPlugin,
    babel({
      babelConfig: {
        plugins: [['babel-plugin-react-compiler']],
        presets: ['@babel/preset-typescript'],
      },
      filter: /(?<!\.test)\.[jt]sx?$/,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  run: {
    tasks: {
      build: {
        command: 'react-router build',
      },
      start: {
        command:
          'if [ ! -f ./build/server/index.js ]; then react-router build; fi && react-router-serve ./build/server/index.js',
      },
    },
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
