import type { OxlintConfig } from 'vite-plus/lint';

import { mergeArrays } from '@repo/utils/merge-arrays';
import { mergeObjects } from '@repo/utils/merge-objects';

type MergeableKey =
  | 'categories'
  | 'env'
  | 'ignorePatterns'
  | 'jsPlugins'
  | 'options'
  | 'overrides'
  | 'plugins'
  | 'rules'
  | 'settings';

type OxlintConfigOverrides = Partial<Pick<OxlintConfig, MergeableKey>>;

export const mergeOxlintConfig = (
  baseConfig: OxlintConfig,
  overrideConfig: OxlintConfigOverrides = {},
): OxlintConfig => ({
  ...baseConfig,
  ...overrideConfig,
  categories: mergeObjects({
    baseValue: baseConfig.categories,
    overrideValue: overrideConfig.categories,
  }),
  env: mergeObjects({
    baseValue: baseConfig.env,
    overrideValue: overrideConfig.env,
  }),
  ignorePatterns: mergeArrays({
    baseValue: baseConfig.ignorePatterns,
    overrideValue: overrideConfig.ignorePatterns,
  }),
  jsPlugins: mergeArrays({
    baseValue: baseConfig.jsPlugins,
    overrideValue: overrideConfig.jsPlugins,
  }),
  options: mergeObjects({
    baseValue: baseConfig.options,
    overrideValue: overrideConfig.options,
  }),
  overrides: mergeArrays({
    baseValue: baseConfig.overrides,
    overrideValue: overrideConfig.overrides,
  }),
  plugins: mergeArrays({
    baseValue: baseConfig.plugins,
    overrideValue: overrideConfig.plugins,
  }),
  rules: mergeObjects({
    baseValue: baseConfig.rules,
    overrideValue: overrideConfig.rules,
  }),
  settings: mergeObjects({
    baseValue: baseConfig.settings,
    overrideValue: overrideConfig.settings,
  }),
});
