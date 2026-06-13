type TsConfig = {
  readonly compilerOptions: Record<string, unknown>;
  readonly exclude: readonly string[];
  readonly include: readonly string[];
};

type CreateAppTsConfigArgs = {
  readonly exclude?: readonly string[];
  readonly include?: readonly string[];
  readonly rootDirs?: readonly string[];
  readonly tsBuildInfoFile: string;
};

type CreateNodeTsConfigArgs = {
  readonly exclude?: readonly string[];
  readonly include?: readonly string[];
  readonly tsBuildInfoFile: string;
};

const APP_TS_CONFIG: Omit<TsConfig, 'compilerOptions'> = {
  exclude: ['vite-monorepo/apps/api-server', 'miscelanious', 'utils'],
  include: [
    'src',
    '**/*',
    '**/.server/**/*',
    '**/.client/**/*',
    '.react-router/types/**/*',
  ],
};

const NODE_TS_CONFIG: Omit<TsConfig, 'compilerOptions'> = {
  exclude: ['utils'],
  include: ['vite.config.ts'],
};

const createAppCompilerOptions = ({
  rootDirs = ['.', './.react-router/types'],
  tsBuildInfoFile,
}: CreateAppTsConfigArgs): Record<string, unknown> => ({
  allowImportingTsExtensions: true,
  erasableSyntaxOnly: true,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  jsx: 'react-jsx',
  lib: ['ES2025', 'DOM', 'DOM.Iterable'],
  module: 'ESNext',
  moduleDetection: 'force',
  moduleResolution: 'bundler',
  noEmit: true,
  noFallthroughCasesInSwitch: true,
  noUncheckedIndexedAccess: true,
  noUncheckedSideEffectImports: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  paths: {
    '@/*': ['./src/*'],
  },
  resolveJsonModule: true,
  rootDirs,
  skipLibCheck: true,
  strict: true,
  target: 'ES2025',
  tsBuildInfoFile,
  types: ['vite/client'],
  useDefineForClassFields: true,
  verbatimModuleSyntax: true,
});

const createNodeCompilerOptions = ({
  tsBuildInfoFile,
}: CreateNodeTsConfigArgs): Record<string, unknown> => ({
  allowImportingTsExtensions: true,
  erasableSyntaxOnly: true,
  forceConsistentCasingInFileNames: true,
  lib: ['ES2025'],
  module: 'ESNext',
  moduleDetection: 'force',
  moduleResolution: 'bundler',
  noEmit: true,
  noFallthroughCasesInSwitch: true,
  noUncheckedSideEffectImports: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  skipLibCheck: true,
  strict: true,
  target: 'ES2025',
  tsBuildInfoFile,
  types: ['node'],
  verbatimModuleSyntax: true,
});

const mergeTsConfig = (
  baseConfig: TsConfig,
  overrides: Partial<TsConfig> = {},
): TsConfig => ({
  ...baseConfig,
  ...overrides,
  compilerOptions: {
    ...baseConfig.compilerOptions,
    ...overrides.compilerOptions,
  },
  exclude: overrides.exclude ?? baseConfig.exclude,
  include: overrides.include ?? baseConfig.include,
});

export const createAppTsConfig = ({
  exclude,
  include,
  rootDirs,
  tsBuildInfoFile,
}: CreateAppTsConfigArgs): TsConfig =>
  mergeTsConfig(
    {
      compilerOptions: createAppCompilerOptions({ rootDirs, tsBuildInfoFile }),
      exclude: APP_TS_CONFIG.exclude,
      include: APP_TS_CONFIG.include,
    },
    {
      exclude,
      include,
    },
  );

export const createNodeTsConfig = ({
  exclude,
  include,
  tsBuildInfoFile,
}: CreateNodeTsConfigArgs): TsConfig =>
  mergeTsConfig(
    {
      compilerOptions: createNodeCompilerOptions({ tsBuildInfoFile }),
      exclude: NODE_TS_CONFIG.exclude,
      include: NODE_TS_CONFIG.include,
    },
    {
      exclude,
      include,
    },
  );
