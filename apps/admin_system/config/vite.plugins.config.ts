import stylex from '@stylexjs/unplugin';
import { reactRouter } from '@react-router/dev/vite';
import { fileURLToPath, URL } from 'node:url';
import { fixReactRouterAssets } from '../utils/fixReactRouterAssets.plugin.ts';
import babel from 'vite-plugin-babel';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const migrateOptimizeDepsConfig = (configResult: unknown): unknown => {
  if (!isRecord(configResult)) {
    return configResult;
  }

  const optimizeDeps = configResult.optimizeDeps;

  if (
    !isRecord(optimizeDeps) ||
    !Object.hasOwn(optimizeDeps, 'esbuildOptions')
  ) {
    return configResult;
  }

  const { esbuildOptions, ...restOptimizeDeps } = optimizeDeps;

  const nextOptimizeDeps =
    esbuildOptions === undefined
      ? restOptimizeDeps
      : {
          ...restOptimizeDeps,
          rolldownOptions: restOptimizeDeps.rolldownOptions ?? esbuildOptions,
        };

  return {
    ...configResult,
    optimizeDeps: nextOptimizeDeps,
  };
};

const patchDeprecatedOptimizeDeps = (pluginOption: unknown): unknown => {
  if (Array.isArray(pluginOption)) {
    return pluginOption.map(patchDeprecatedOptimizeDeps);
  }

  if (!isRecord(pluginOption)) {
    return pluginOption;
  }

  const configHook = pluginOption.config;

  if (typeof configHook !== 'function') {
    return pluginOption;
  }

  return {
    ...pluginOption,
    config: async (...args: readonly unknown[]) => {
      const result = await configHook(...args);
      return migrateOptimizeDepsConfig(result);
    },
  };
};

const isTestTaskRun =
  process.env.VITEST === 'true' ||
  process.env.REACT_ROUTER_TEST_TASK === 'true';
const reactRouterPlugin = isTestTaskRun ? [] : [reactRouter()];
const babelPlugin = isTestTaskRun
  ? []
  : [
      patchDeprecatedOptimizeDeps(
        babel({
          babelConfig: {
            plugins: [['babel-plugin-react-compiler']],
            presets: ['@babel/preset-typescript'],
          },
          include: /(?<!\.test)\.[jt]sx?$/,
        }),
      ),
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
