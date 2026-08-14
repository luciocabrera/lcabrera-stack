import { describe, expect, it } from 'vite-plus/test';

import { createAppTsConfig, createNodeTsConfig } from './tsconfig.shared.ts';

const TS_BUILD_INFO = './node_modules/.tmp/tsconfig.app.tsbuildinfo';

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

  // The negative case for the one default that is a toolchain fact rather than
  // a config-variant fact: `vite/client` does not resolve outside a Vite
  // project, so a consumer that cannot drop it gets a config that fails to
  // load. Appending was the only thing `types` allowed before this.
  it('lets a caller drop vite/client entirely', () => {
    const { compilerOptions } = createAppTsConfig({
      baseTypes: [],
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions.types).toStrictEqual([]);
  });

  it('lets a caller replace vite/client with its own client types', () => {
    const { compilerOptions } = createAppTsConfig({
      baseTypes: ['webpack-env'],
      tsBuildInfoFile: TS_BUILD_INFO,
      types: ['node'],
    });

    expect(compilerOptions.types).toStrictEqual(['webpack-env', 'node']);
  });

  it('still defaults to vite/client when baseTypes is not passed', () => {
    const { compilerOptions } = createAppTsConfig({
      tsBuildInfoFile: TS_BUILD_INFO,
    });

    expect(compilerOptions.types).toStrictEqual(['vite/client']);
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
