import { describe, expect, it } from 'vite-plus/test';

import { configs } from './tsconfig.entries.ts';
import { createAppTsConfig, createNodeTsConfig } from './tsconfig.shared.ts';

const TS_BUILD_INFO = './node_modules/.tmp/tsconfig.app.tsbuildinfo';

const configFor = (suffix: string) => {
  const entry = configs.find(({ filePath }) => filePath.endsWith(suffix));

  if (!entry) {
    throw new Error(`no generated config ends with ${suffix}`);
  }

  return entry.config;
};

describe('createAppTsConfig', () => {
  it('omits paths entirely when there is nothing to alias', () => {
    const { compilerOptions } = createAppTsConfig({
      srcAlias: false,
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions).not.toHaveProperty('paths');
  });

  it('omits paths when the caller passes an empty alias map', () => {
    const { compilerOptions } = createAppTsConfig({
      paths: {},
      srcAlias: false,
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions).not.toHaveProperty('paths');
  });

  it('maps @/* to ./src/* by default', () => {
    const { compilerOptions } = createAppTsConfig({
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions.paths).toStrictEqual({ '@/*': ['./src/*'] });
  });

  it('merges caller aliases on top of the default @/* mapping', () => {
    const { compilerOptions } = createAppTsConfig({
      paths: { '@lcabrera/server/*': ['../../packages/server/src/*'] },
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions.paths).toStrictEqual({
      '@/*': ['./src/*'],
      '@lcabrera/server/*': ['../../packages/server/src/*'],
    });
  });

  it('keeps caller aliases when the default @/* mapping is off', () => {
    const { compilerOptions } = createAppTsConfig({
      paths: { '@lcabrera/ui': ['../../packages/ui/src/public-api.ts'] },
      srcAlias: false,
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions.paths).toStrictEqual({
      '@lcabrera/ui': ['../../packages/ui/src/public-api.ts'],
    });
  });

  it('appends extra type roots after the default vite/client', () => {
    const { compilerOptions } = createAppTsConfig({
      tsBuildInfoFile: TS_BUILD_INFO,
      types: ['node'],
    });

    expect(compilerOptions.types).toStrictEqual(['vite/client', 'node']);
  });

  it('lets a caller override include and exclude', () => {
    const config = createAppTsConfig({
      exclude: ['node_modules'],
      include: ['src'],
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(config.include).toStrictEqual(['src']);
    expect(config.exclude).toStrictEqual(['node_modules']);
  });
});

describe('createNodeTsConfig', () => {
  it('omits paths when the caller passes none', () => {
    const { compilerOptions } = createNodeTsConfig({
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions).not.toHaveProperty('paths');
  });

  it('defaults to the node type root and honours an empty list', () => {
    expect(
      createNodeTsConfig({ tsBuildInfoFile: TS_BUILD_INFO }).compilerOptions
        .types,
    ).toStrictEqual(['node']);

    expect(
      createNodeTsConfig({ tsBuildInfoFile: TS_BUILD_INFO, types: [] })
        .compilerOptions.types,
    ).toStrictEqual([]);
  });
});

describe('the generated packages/ui config', () => {
  // ADR-060's load-bearing half. `@lcabrera/ui` ships source, so a consumer
  // compiles our files and every self-import resolves through our own
  // exports/imports map. A tsconfig alias short-circuits that map in-repo,
  // which is exactly how eight wildcard `exports` entries that resolved for
  // nobody stayed green here for their whole life. With no alias,
  // `vp run typecheck` is the thing that catches an unexported deep import.
  it('carries no path aliases at all', () => {
    expect(configFor('packages/ui/tsconfig.app.json')).not.toHaveProperty(
      'compilerOptions.paths',
    );
  });

  it('still type-checks both of the runtimes its src/ mixes', () => {
    // Components are browser-context, src/entry/ is Node-context SSR, and the
    // package has no vite.config.ts to anchor a second tsconfig project around.
    expect(configFor('packages/ui/tsconfig.app.json')).toHaveProperty(
      'compilerOptions.types',
      ['vite/client', 'node'],
    );
  });
});

describe('the generated app configs', () => {
  // The apps are the only legitimate holders of a `@lcabrera/ui` alias, and it
  // must stay the bare specifier: a `/*` form would resolve deep imports past
  // the package's exports map and reinstate the blind spot ADR-060 closed.
  it('alias @lcabrera/ui by bare specifier only, never by wildcard', () => {
    const aliases = configs.flatMap(({ config }) =>
      Object.keys(
        (config.compilerOptions as { readonly paths?: Record<string, unknown> })
          .paths ?? {},
      ),
    );

    expect(aliases).toContain('@lcabrera/ui');
    expect(aliases).not.toContain('@lcabrera/ui/*');
  });
});
