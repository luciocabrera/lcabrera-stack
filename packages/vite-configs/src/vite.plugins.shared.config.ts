import type { PluginOption } from 'vite-plus';

import { reactRouter } from '@react-router/dev/vite';
import { unplugin as stylex } from '@stylexjs/unplugin';
import { fileURLToPath, URL } from 'node:url';
import babel from 'vite-plugin-babel';

import { fixReactRouterAssets } from './fixReactRouterAssets.plugin.ts';

type CreateReactRouterPluginsConfigArgs = {
  readonly appRootUrl: string;
  readonly babelConfigOverrides?: UnknownRecord;
  readonly babelIncludePattern?: RegExp;
  readonly isTestTaskRun?: boolean;
  readonly pluginsAfter?: PluginOption[];
  readonly pluginsBefore?: PluginOption[];
  /**
   * Extra StyleX aliases beyond `@/*`, each a URL pattern resolved against
   * `appRootUrl`. Empty by default: a monorepo that compiles a sibling
   * package's StyleX needs one, and its path is that repo's layout, not
   * something a consumer of this package should inherit (ADR-069).
   */
  readonly stylexAliases?: Readonly<Record<string, string>>;
  readonly stylexAliasPattern?: string;
  readonly stylexDev?: boolean;
  readonly stylexUseCSSLayers?: boolean;
  readonly withBabelPlugin?: boolean;
  readonly withFixReactRouterAssetsPlugin?: boolean;
  readonly withReactRouterPlugin?: boolean;
};

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
    return pluginOption.map((option) => patchDeprecatedOptimizeDeps(option));
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

// The stylex unplugin's configureServer hook starts a 150ms setInterval that
// is only cleared on `server.httpServer.close`. Vitest runs Vite in middleware
// mode with no httpServer, so the interval is never cleared and keeps the test
// process alive ("close timed out after 10000ms"). Dev-server hooks are
// irrelevant under vitest, so strip the hook for test task runs only.
const stripConfigureServerHook = (pluginOption: PluginOption): PluginOption => {
  if (Array.isArray(pluginOption)) {
    return pluginOption.map((option) => stripConfigureServerHook(option));
  }

  if (!isRecord(pluginOption) || !('configureServer' in pluginOption)) {
    return pluginOption;
  }

  // Rebuilt by filtering rather than by rest-destructuring the key away: the
  // omitted binding is unused by construction, and an unused binding is a
  // finding this package may not suppress (AGENTS.md §4).
  return Object.fromEntries(
    Object.entries(pluginOption).filter(([key]) => key !== 'configureServer'),
  ) as PluginOption;
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
  stylexAliases = {},
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

  const stylexPlugin = stylex.vite({
    aliases: {
      '@/*': [fileURLToPath(new URL(stylexAliasPattern, appRootUrl))],
      ...Object.fromEntries(
        Object.entries(stylexAliases).map(([alias, pattern]) => [
          alias,
          [fileURLToPath(new URL(pattern, appRootUrl))],
        ]),
      ),
    },
    dev: stylexDev,
    useCSSLayers: stylexUseCSSLayers,
  });

  return [
    ...pluginsBefore,
    isTestTaskRun ? stripConfigureServerHook(stylexPlugin) : stylexPlugin,
    ...(withFixReactRouterAssetsPlugin ? [fixReactRouterAssets()] : []),
    ...reactRouterPlugin,
    ...babelPlugin,
    ...pluginsAfter,
  ];
};
