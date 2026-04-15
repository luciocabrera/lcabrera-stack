const BASE_IGNORE_PATTERNS = ['dist/', 'node_modules/'] as const;

/**
 * Creates an Oxfmt formatter configuration for all packages in this monorepo.
 * Accepts additional `ignorePatterns` on top of the shared base patterns.
 */
export const createFmtConfig = (
  extraIgnorePatterns: readonly string[] = [],
) => ({
  arrowParens: 'always' as const,
  bracketSpacing: true,
  endOfLine: 'lf' as const,
  ignorePatterns: [...BASE_IGNORE_PATTERNS, ...extraIgnorePatterns],
  jsxSingleQuote: true,
  printWidth: 80,
  semi: true,
  singleQuote: true,
  sortPackageJson: true,
  tabWidth: 2,
  trailingComma: 'all' as const,
});
