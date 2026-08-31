import type { Plugin } from 'vite-plus';

import { describe, expect, it } from 'vite-plus/test';

import type { ReactRouterAssetsFileSystem } from './fixReactRouterAssets.plugin.ts';

import { fixReactRouterAssets } from './fixReactRouterAssets.plugin.ts';

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
