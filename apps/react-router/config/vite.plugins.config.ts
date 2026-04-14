import stylex from '@stylexjs/unplugin';
import { reactRouter } from '@react-router/dev/vite';
import { fileURLToPath, URL } from 'node:url';
import { fixReactRouterAssets } from '../utils/fixReactRouterAssets.plugin.ts';
import babel from 'vite-plugin-babel';

const isTestTaskRun =
  process.env.VITEST === 'true' ||
  process.env.REACT_ROUTER_TEST_TASK === 'true';
const reactRouterPlugin = isTestTaskRun ? [] : [reactRouter()];
const babelPlugin = isTestTaskRun
  ? []
  : [
      babel({
        babelConfig: {
          plugins: [['babel-plugin-react-compiler']],
          presets: ['@babel/preset-typescript'],
        },
        filter: /(?<!\.test)\.[jt]sx?$/,
      }),
    ];

export const pluginsConfig = [
  stylex.vite({
    aliases: {
      '@/*': [fileURLToPath(new URL('../src/*', import.meta.url))],
    },
    dev: process.env.NODE_ENV === 'development',
    useCSSLayers: true,
  }),
  fixReactRouterAssets(),
  ...reactRouterPlugin,
  ...babelPlugin,
];
