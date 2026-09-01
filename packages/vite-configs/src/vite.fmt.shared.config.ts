import type { OxfmtConfig } from 'vite-plus/fmt';

const BASE_IGNORE_PATTERNS = [
  'dist/',
  'node_modules/',
  'eslint-suppressions.json',
] as const;

type CreateFmtConfigArgs = {
  readonly ignorePatterns?: readonly string[];
  readonly overrides?: Partial<Omit<FmtConfig, 'ignorePatterns'>>;
};

type FmtConfig = OxfmtConfig & {
  readonly arrowParens: 'always';
  readonly bracketSpacing: true;
  readonly endOfLine: 'lf';
  readonly ignorePatterns: string[];
  readonly jsxSingleQuote: true;
  readonly printWidth: 80;
  readonly semi: true;
  readonly singleQuote: true;
  readonly sortPackageJson: true;
  readonly tabWidth: 2;
  readonly trailingComma: 'all';
};

const BASE_FMT_CONFIG: FmtConfig = {
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  ignorePatterns: [...BASE_IGNORE_PATTERNS] as string[],
  jsxSingleQuote: true,
  printWidth: 80,
  semi: true,
  singleQuote: true,
  sortPackageJson: true,
  tabWidth: 2,
  trailingComma: 'all',
};

export const createFmtConfig = ({
  ignorePatterns = [],
  overrides = {},
}: CreateFmtConfigArgs = {}): FmtConfig => ({
  ...BASE_FMT_CONFIG,
  ...overrides,
  ignorePatterns: [...BASE_IGNORE_PATTERNS, ...ignorePatterns] as string[],
});
