type CreateAppTsConfigArgs = {
  readonly exclude?: readonly string[];
  readonly include?: readonly string[];
  /** Extra path aliases merged on top of the default `@/*` → `./src/*` mapping — for a package's own self-referencing alias (e.g. `@repo/ui/*`) or a cross-package one. */
  readonly paths?: Record<string, readonly string[]>;
  readonly rootDirs?: readonly string[];
  /** Set `false` to omit the default `@/*` → `./src/*` alias. Publishable packages pass this: `@/` resolves only through a tsconfig, so an `@/` import cannot survive publication, and dropping the alias makes tsc reject one instead of a reviewer having to spot it. */
  readonly srcAlias?: boolean;
  readonly tsBuildInfoFile: string;
  /** Extra ambient type roots appended to the default `['vite/client']` — e.g. `'node'` for a package whose src/ mixes browser-context and Node-context (SSR entry) files. */
  readonly types?: readonly string[];
};

type CreateNodeTsConfigArgs = {
  readonly exclude?: readonly string[];
  readonly include?: readonly string[];
  /** Path aliases for this config — node configs have none by default. */
  readonly paths?: Record<string, readonly string[]>;
  readonly tsBuildInfoFile: string;
  /** Ambient type roots — defaults to `['node']`. Pass `[]` for a package contractually barred from Node globals (e.g. `@repo/utils`, which is pure and side-effect free), so the config cannot hand it the APIs it must not reach for. */
  readonly types?: readonly string[];
};

type TsConfig = {
  readonly compilerOptions: Record<string, unknown>;
  readonly exclude: readonly string[];
  readonly include: readonly string[];
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
  paths: {
    ...(srcAlias && { '@/*': ['./src/*'] }),
    ...paths,
  },
  resolveJsonModule: true,
  rootDirs,
  skipLibCheck: true,
  strict: true,
  target: 'ES2025',
  tsBuildInfoFile,
  types: ['vite/client', ...types],
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
  // Kept in lockstep with createAppCompilerOptions: without it the Node-context
  // packages were type-checked strictly less than the browser ones, so an
  // unchecked arr[0] passed here and failed there for no principled reason.
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
  paths,
  rootDirs,
  srcAlias,
  tsBuildInfoFile,
  types,
}: CreateAppTsConfigArgs): TsConfig =>
  mergeTsConfig(
    {
      compilerOptions: createAppCompilerOptions({
        paths,
        rootDirs,
        srcAlias,
        tsBuildInfoFile,
        types,
      }),
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
  paths,
  tsBuildInfoFile,
  types,
}: CreateNodeTsConfigArgs): TsConfig =>
  mergeTsConfig(
    {
      compilerOptions: createNodeCompilerOptions({
        paths,
        tsBuildInfoFile,
        types,
      }),
      exclude: NODE_TS_CONFIG.exclude,
      include: NODE_TS_CONFIG.include,
    },
    {
      exclude,
      include,
    },
  );
