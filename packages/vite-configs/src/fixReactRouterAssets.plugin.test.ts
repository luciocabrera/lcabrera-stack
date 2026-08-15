import type { Plugin } from 'vite-plus';

import { describe, expect, it } from 'vite-plus/test';

import type { ReactRouterAssetsFileSystem } from './fixReactRouterAssets.plugin.ts';

import { fixReactRouterAssets } from './fixReactRouterAssets.plugin.ts';

// The regression this plugin exists for (#329-era SSR builds: react-router
// renames a CSS asset Rolldown never emitted, and the build dies with ENOENT)
// only shows up as a file appearing on disk, so asserting on the plugin object
// would prove nothing. These cases run the real writeBundle hook against an
// in-memory filesystem and read back what it wrote.

const CWD = '/build-root';
const SERVER_MANIFEST = `${CWD}/build/server/.vite/manifest.json`;
const CLIENT_ASSETS = `${CWD}/build/client/assets`;

type FakeFileSystem = {
  readonly directories: Set<string>;
  readonly files: Map<string, string>;
  readonly fileSystem: ReactRouterAssetsFileSystem;
};

const createFakeFileSystem = (seed: Readonly<Record<string, string>> = {}) => {
  const files = new Map<string, string>(Object.entries(seed));
  const directories = new Set<string>();

  // Annotated per member, the way `@lcabrera/tsconfig`'s writer test does it:
  // the parameter list is node:fs's, not this file's, and the annotation is
  // what says so.
  const copyFileSync: ReactRouterAssetsFileSystem['copyFileSync'] = (
    source,
    destination,
  ) => {
    files.set(destination, files.get(source) ?? '');
  };

  const writeFileSync: ReactRouterAssetsFileSystem['writeFileSync'] = (
    target,
    contents,
  ) => {
    files.set(target, contents);
  };

  // `existsSync` answers for directories too, which is not a detail: the plugin
  // asks it about `build/client/assets` before reading it, and a fake that only
  // knows files reports the client build as absent — so every case would take
  // the empty-placeholder branch and the copy path would never be exercised.
  const containsPath = (target: string) =>
    files.has(target) ||
    directories.has(target) ||
    files.keys().some((file) => file.startsWith(`${target}/`));

  const fileSystem: ReactRouterAssetsFileSystem = {
    copyFileSync,
    existsSync: containsPath,
    mkdirSync: (directory) => directories.add(directory),
    readdirSync: (directory) =>
      files
        .keys()
        .filter((file) => file.startsWith(`${directory}/`))
        .map((file) => file.slice(directory.length + 1))
        .toArray(),
    readFileSync: (target) => files.get(target) ?? '',
    writeFileSync,
  };

  return { directories, files, fileSystem } satisfies FakeFileSystem;
};

/**
 * Rollup types `writeBundle` as an object-or-function hook; this plugin declares
 * the function form, and running it is the only way to observe the effect.
 */
const runWriteBundle = (plugin: Plugin) => {
  const hook = plugin.writeBundle;
  if (typeof hook !== 'function') {
    throw new TypeError('writeBundle is not declared as a plain function');
  }
  (hook as unknown as () => void)();
};

const manifestJson = (chunks: Readonly<Record<string, unknown>>) =>
  JSON.stringify(chunks);

describe('fixReactRouterAssets', () => {
  it('copies the client CSS into a server asset the manifest claims exists', () => {
    const { files, fileSystem } = createFakeFileSystem({
      [`${CLIENT_ASSETS}/root-abc.css`]: '.from-client{}',
      [SERVER_MANIFEST]: manifestJson({
        'root.tsx': { assets: ['assets/root-abc.css'], file: 'root.js' },
      }),
    });

    runWriteBundle(fixReactRouterAssets({ cwd: CWD, fileSystem }));

    expect(files.get(`${CWD}/build/server/assets/root-abc.css`)).toBe(
      '.from-client{}',
    );
  });

  it('writes an empty placeholder when the client build has no CSS', () => {
    const { files, fileSystem } = createFakeFileSystem({
      [SERVER_MANIFEST]: manifestJson({
        'entry.css': { file: 'assets/entry-def.css' },
      }),
    });

    runWriteBundle(fixReactRouterAssets({ cwd: CWD, fileSystem }));

    expect(files.get(`${CWD}/build/server/assets/entry-def.css`)).toBe('');
  });

  it('leaves an existing server asset untouched', () => {
    const { files, fileSystem } = createFakeFileSystem({
      [`${CLIENT_ASSETS}/root-abc.css`]: '.from-client{}',
      [`${CWD}/build/server/assets/root-abc.css`]: '.already-there{}',
      [SERVER_MANIFEST]: manifestJson({
        'root.tsx': { assets: ['assets/root-abc.css'], file: 'root.js' },
      }),
    });

    runWriteBundle(fixReactRouterAssets({ cwd: CWD, fileSystem }));

    expect(files.get(`${CWD}/build/server/assets/root-abc.css`)).toBe(
      '.already-there{}',
    );
  });

  it('does nothing at all when there is no server manifest', () => {
    const { files, fileSystem } = createFakeFileSystem();

    runWriteBundle(fixReactRouterAssets({ cwd: CWD, fileSystem }));

    expect(files.size).toBe(0);
  });

  it('creates the parent directory before writing into it', () => {
    const { directories, fileSystem } = createFakeFileSystem({
      [SERVER_MANIFEST]: manifestJson({
        'entry.css': { file: 'assets/entry-def.css' },
      }),
    });

    runWriteBundle(fixReactRouterAssets({ cwd: CWD, fileSystem }));

    expect(directories.has(`${CWD}/build/server/assets`)).toBe(true);
  });
});
