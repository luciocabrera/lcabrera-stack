import type { OxlintConfig } from 'vite-plus/lint';

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

const mergeArrays = <T>(
  baseValue: readonly T[] | null | undefined,
  overrideValue: readonly T[] | null | undefined,
): T[] | undefined => {
  if (baseValue == null && overrideValue == null) {
    return undefined;
  }

  return [...(baseValue ?? []), ...(overrideValue ?? [])];
};

const mergeObjects = <T extends object>(
  baseValue: T | undefined,
  overrideValue: Partial<T> | undefined,
): T | undefined => {
  if (baseValue === undefined && overrideValue === undefined) {
    return undefined;
  }

  return {
    ...baseValue,
    ...overrideValue,
  } as T;
};

export const mergeOxlintConfig = (
  baseConfig: OxlintConfig,
  overrideConfig: OxlintConfigOverrides = {},
): OxlintConfig => ({
  ...baseConfig,
  ...overrideConfig,
  categories: mergeObjects(baseConfig.categories, overrideConfig.categories),
  env: mergeObjects(baseConfig.env, overrideConfig.env),
  ignorePatterns: mergeArrays(
    baseConfig.ignorePatterns,
    overrideConfig.ignorePatterns,
  ),
  jsPlugins: mergeArrays(baseConfig.jsPlugins, overrideConfig.jsPlugins),
  options: mergeObjects(baseConfig.options, overrideConfig.options),
  overrides: mergeArrays(baseConfig.overrides, overrideConfig.overrides),
  plugins: mergeArrays(baseConfig.plugins, overrideConfig.plugins),
  rules: mergeObjects(baseConfig.rules, overrideConfig.rules),
  settings: mergeObjects(baseConfig.settings, overrideConfig.settings),
});
