export type CreateAppTsConfigArgs = {
  /** Ambient type roots `types` is appended to; defaults to `['vite/client']`. Pass `[]` outside a Vite project. */
  readonly baseTypes?: readonly string[];
  readonly exclude?: readonly string[];
  readonly include?: readonly string[];
  /** Merged on top of the default `@/*` -> `./src/*` mapping, not replacing it. */
  readonly paths?: Record<string, readonly string[]>;
  readonly rootDirs?: readonly string[];
  /** Set `false` to omit the default `@/*` -> `./src/*` alias; publishable packages pass this. */
  readonly srcAlias?: boolean;
  readonly tsBuildInfoFile: string;
  /** Extra roots appended to `baseTypes`, e.g. `'node'` for a src/ that mixes browser and Node files. */
  readonly types?: readonly string[];
};

export type CreateNodeTsConfigArgs = {
  readonly exclude?: readonly string[];
  readonly include?: readonly string[];
  /** Node configs have none by default. */
  readonly paths?: Record<string, readonly string[]>;
  readonly tsBuildInfoFile: string;
  /** Defaults to `['node']`. Pass `[]` for a package barred from Node globals. */
  readonly types?: readonly string[];
};

export type TsConfig = {
  readonly compilerOptions: Record<string, unknown>;
  readonly exclude: readonly string[];
  readonly include: readonly string[];
};

const APP_TS_CONFIG: Omit<TsConfig, 'compilerOptions'> = {
  exclude: [],
  include: [
    'src',
    '**/*',
    '**/.server/**/*',
    '**/.client/**/*',
    '.react-router/types/**/*',
  ],
};

const NODE_TS_CONFIG: Omit<TsConfig, 'compilerOptions'> = {
  exclude: [],
  include: ['vite.config.ts'],
};

const createAppCompilerOptions = ({
  baseTypes = ['vite/client'],
  paths,
  rootDirs = ['.', './.react-router/types'],
  srcAlias = true,
  tsBuildInfoFile,
  types = [],
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
  ...((srcAlias || Object.keys(paths ?? {}).length > 0) && {
    paths: {
      ...(srcAlias && { '@/*': ['./src/*'] }),
      ...paths,
    },
  }),
  resolveJsonModule: true,
  rootDirs,
  skipLibCheck: true,
  strict: true,
  target: 'ES2025',
  tsBuildInfoFile,
  types: [...baseTypes, ...types],
  useDefineForClassFields: true,
  verbatimModuleSyntax: true,
});

const createNodeCompilerOptions = ({
  paths,
  tsBuildInfoFile,
  types = ['node'],
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
  noUncheckedIndexedAccess: true,
  noUncheckedSideEffectImports: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  ...(paths && { paths }),
  skipLibCheck: true,
  strict: true,
  target: 'ES2025',
  tsBuildInfoFile,
  types,
  verbatimModuleSyntax: true,
});

type MergeTsConfigArgs = {
  readonly baseConfig: TsConfig;
  readonly overrides?: Partial<TsConfig>;
};

const mergeTsConfig = ({
  baseConfig,
  overrides = {},
}: MergeTsConfigArgs): TsConfig => ({
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
  baseTypes,
  exclude,
  include,
  paths,
  rootDirs,
  srcAlias,
  tsBuildInfoFile,
  types,
}: CreateAppTsConfigArgs): TsConfig =>
  mergeTsConfig({
    baseConfig: {
      compilerOptions: createAppCompilerOptions({
        baseTypes,
        paths,
        rootDirs,
        srcAlias,
        tsBuildInfoFile,
        types,
      }),
      exclude: APP_TS_CONFIG.exclude,
      include: APP_TS_CONFIG.include,
    },
    overrides: {
      exclude,
      include,
    },
  });

export const createNodeTsConfig = ({
  exclude,
  include,
  paths,
  tsBuildInfoFile,
  types,
}: CreateNodeTsConfigArgs): TsConfig =>
  mergeTsConfig({
    baseConfig: {
      compilerOptions: createNodeCompilerOptions({
        paths,
        tsBuildInfoFile,
        types,
      }),
      exclude: NODE_TS_CONFIG.exclude,
      include: NODE_TS_CONFIG.include,
    },
    overrides: {
      exclude,
      include,
    },
  });
