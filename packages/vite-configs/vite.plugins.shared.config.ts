import { unplugin as stylex } from '@stylexjs/unplugin';
import { reactRouter } from '@react-router/dev/vite';
import { fileURLToPath, URL } from 'node:url';
import { fixReactRouterAssets } from '@repo/plugins/fixReactRouterAssets';
import babel from 'vite-plugin-babel';
import type { PluginOption } from 'vite-plus';

type UnknownRecord = Record<string, unknown>;

type CreateReactRouterPluginsConfigArgs = {
  readonly appRootUrl: string;
  readonly babelConfigOverrides?: UnknownRecord;
  readonly babelIncludePattern?: RegExp;
  readonly isTestTaskRun?: boolean;
  readonly pluginsAfter?: PluginOption[];
  readonly pluginsBefore?: PluginOption[];
  readonly stylexAliasPattern?: string;
  readonly stylexDev?: boolean;
  readonly stylexUseCSSLayers?: boolean;
  readonly withBabelPlugin?: boolean;
  readonly withFixReactRouterAssetsPlugin?: boolean;
  readonly withReactRouterPlugin?: boolean;
};

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

const isTestTaskRunFromEnv = (): boolean =>
  process.env.REACT_ROUTER_TEST_TASK === 'true' ||
  process.env.VITEST === 'true';

export const createReactRouterPluginsConfig = ({
  appRootUrl,
  babelConfigOverrides = {},
  babelIncludePattern = /^(?!.*\.test\.).*\.[jt]sx?$/,
  isTestTaskRun = isTestTaskRunFromEnv(),
  pluginsAfter = [],
  pluginsBefore = [],
  stylexAliasPattern = '../src/*',
  stylexDev = process.env.NODE_ENV === 'development',
  stylexUseCSSLayers = true,
  withBabelPlugin = true,
  withFixReactRouterAssetsPlugin = true,
  withReactRouterPlugin = true,
}: CreateReactRouterPluginsConfigArgs): PluginOption[] => {
  const reactRouterPlugin =
    isTestTaskRun || !withReactRouterPlugin ? [] : [reactRouter()];
  const babelPlugin =
    isTestTaskRun || !withBabelPlugin
      ? []
      : [
          patchDeprecatedOptimizeDeps(
            babel({
              babelConfig: {
                plugins: [['babel-plugin-react-compiler']],
                presets: ['@babel/preset-typescript'],
                ...babelConfigOverrides,
              },
              include: babelIncludePattern,
            }),
          ),
        ];

  return [
    ...pluginsBefore,
    stylex.vite({
      aliases: {
        '@/*': [fileURLToPath(new URL(stylexAliasPattern, appRootUrl))],
      },
      dev: stylexDev,
      useCSSLayers: stylexUseCSSLayers,
    }),
    ...(withFixReactRouterAssetsPlugin ? [fixReactRouterAssets()] : []),
    ...reactRouterPlugin,
    ...babelPlugin,
    ...pluginsAfter,
  ];
};
