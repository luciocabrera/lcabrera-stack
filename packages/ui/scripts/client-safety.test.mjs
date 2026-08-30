import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  buildWorkspaceDirectoryIndex,
  collectDependencyClosure,
  collectPublishedSourceFiles,
  collectScanDefects,
  scanWorkspaceDependencies,
  selectWorkspaceDependencies,
} from './client-safety.mjs';
import {
  CLEAN_SOURCE,
  scaffold,
  SERVER_ONLY_SOURCE,
} from './lib/client-safety-fixtures.mjs';

describe('buildWorkspaceDirectoryIndex', () => {
  it('places a package by the name it publishes, not by the name of its directory', () => {
    const root = scaffold([
      { directory: 'node-runtime', name: '@scope/node' },
      { directory: 'utils', name: '@scope/utils' },
    ]);

    expect(buildWorkspaceDirectoryIndex(root).get('@scope/node')).toBe(
      join(root, 'packages', 'node-runtime'),
    );
  });
});

describe('selectWorkspaceDependencies', () => {
  it('selects a workspace dependency whatever npm scope it carries', () => {
    const root = scaffold([{ directory: 'utils', name: '@lcabrera/utils' }]);

    expect(
      selectWorkspaceDependencies({
        manifest: {
          dependencies: { '@lcabrera/utils': 'workspace:*', isbot: '^5.0.0' },
        },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }),
    ).toEqual([
      {
        packageDir: join(root, 'packages', 'utils'),
        packageName: '@lcabrera/utils',
      },
    ]);
  });

  it('keeps a workspace-protocol dependency the roster cannot place, rather than dropping it', () => {
    const root = scaffold([{ directory: 'utils', name: '@scope/utils' }]);

    expect(
      selectWorkspaceDependencies({
        manifest: { dependencies: { '@scope/ghost': 'workspace:*' } },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }),
    ).toEqual([{ packageDir: null, packageName: '@scope/ghost' }]);
  });
});

describe('collectDependencyClosure', () => {
  it('follows the edges a dependency declares, not only the ones this package declares', () => {
    const root = scaffold([
      {
        dependencies: { '@scope/deep': 'workspace:*' },
        directory: 'api',
        name: '@scope/api',
      },
      { directory: 'deep', name: '@scope/deep' },
    ]);

    expect(
      collectDependencyClosure({
        manifest: {
          dependencies: { '@scope/api': 'workspace:*' },
          name: '@scope/ui',
        },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }),
    ).toEqual([
      {
        packageDir: join(root, 'packages', 'api'),
        packageName: '@scope/api',
        requiredBy: '@scope/ui',
      },
      {
        packageDir: join(root, 'packages', 'deep'),
        packageName: '@scope/deep',
        requiredBy: '@scope/api',
      },
    ]);
  });

  it('names a package once, as a direct dependency, when a dependency also declares it', () => {
    const root = scaffold([
      {
        dependencies: { '@scope/utils': 'workspace:*' },
        directory: 'api',
        name: '@scope/api',
      },
      { directory: 'utils', name: '@scope/utils' },
    ]);

    expect(
      collectDependencyClosure({
        manifest: {
          dependencies: {
            '@scope/api': 'workspace:*',
            '@scope/utils': 'workspace:*',
          },
          name: '@scope/ui',
        },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }).map(({ packageName, requiredBy }) => ({ packageName, requiredBy })),
    ).toEqual([
      { packageName: '@scope/api', requiredBy: '@scope/ui' },
      { packageName: '@scope/utils', requiredBy: '@scope/ui' },
    ]);
  });

  it('stops at the package the walk started from', () => {
    const root = scaffold([
      {
        dependencies: { '@scope/ui': 'workspace:*' },
        directory: 'api',
        name: '@scope/api',
      },
      { directory: 'ui', name: '@scope/ui' },
    ]);

    expect(
      collectDependencyClosure({
        manifest: {
          dependencies: { '@scope/api': 'workspace:*' },
          name: '@scope/ui',
        },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }).map(({ packageName }) => packageName),
    ).toEqual(['@scope/api']);
  });

  it('terminates on a dependency cycle', () => {
    const root = scaffold([
      {
        dependencies: { '@scope/b': 'workspace:*' },
        directory: 'a',
        name: '@scope/a',
      },
      {
        dependencies: { '@scope/a': 'workspace:*' },
        directory: 'b',
        name: '@scope/b',
      },
    ]);

    expect(
      collectDependencyClosure({
        manifest: {
          dependencies: { '@scope/a': 'workspace:*' },
          name: '@scope/ui',
        },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }).map(({ packageName }) => packageName),
    ).toEqual(['@scope/a', '@scope/b']);
  });
});

describe('collectPublishedSourceFiles', () => {
  it('leaves out what the package excludes from `files`, which no install receives', () => {
    const root = scaffold([
      {
        directory: 'utils',
        files: ['src', '!src/**/*.test.*', '!src/benchmarks'],
        name: '@scope/utils',
        sources: {
          'benchmarks/merge.bench.ts': CLEAN_SOURCE,
          'merge.test.ts': SERVER_ONLY_SOURCE,
          'merge.ts': CLEAN_SOURCE,
        },
      },
    ]);

    expect(
      collectPublishedSourceFiles(join(root, 'packages', 'utils')),
    ).toEqual([join(root, 'packages', 'utils', 'src', 'merge.ts')]);
  });

  it('reads every source file when the manifest excludes nothing', () => {
    const root = scaffold([
      {
        directory: 'utils',
        name: '@scope/utils',
        sources: { 'merge.test.ts': CLEAN_SOURCE, 'merge.ts': CLEAN_SOURCE },
      },
    ]);

    expect(
      collectPublishedSourceFiles(join(root, 'packages', 'utils')).sort(),
    ).toEqual([
      join(root, 'packages', 'utils', 'src', 'merge.test.ts'),
      join(root, 'packages', 'utils', 'src', 'merge.ts'),
    ]);
  });
});

describe('collectScanDefects', () => {
  it('reports the empty dependency set — a scan of nothing is not a clean run', () => {
    expect(collectScanDefects([])).toEqual([
      expect.stringContaining('no workspace dependency was selected'),
    ]);
  });

  it('reports a dependency the roster could not place', () => {
    expect(
      collectScanDefects([
        {
          packageDir: null,
          packageName: '@scope/ghost',
          requiredBy: '@scope/api',
          sourceFiles: [],
        },
      ]),
    ).toEqual([
      expect.stringContaining('@scope/ghost is a dependency of @scope/api'),
    ]);
  });

  it('reports a dependency whose resolved directory held nothing to read', () => {
    expect(
      collectScanDefects([
        {
          packageDir: '/somewhere/packages/utils',
          packageName: '@scope/utils',
          sourceFiles: [],
        },
      ]),
    ).toEqual([expect.stringContaining('holds no source file')]);
  });

  it('reports nothing once a dependency was actually opened', () => {
    expect(
      collectScanDefects([
        {
          packageDir: '/somewhere/packages/utils',
          packageName: '@scope/utils',
          sourceFiles: ['/somewhere/packages/utils/src/one.ts'],
        },
      ]),
    ).toEqual([]);
  });
});

describe('scanWorkspaceDependencies', () => {
  it('reads the source of the directory the roster gave, not of one named after the package', () => {
    const root = scaffold([
      {
        directory: 'node-runtime',
        name: '@scope/node',
        sources: { 'read.ts': SERVER_ONLY_SOURCE },
      },
    ]);

    expect(
      scanWorkspaceDependencies({
        manifest: {
          dependencies: { '@scope/node': 'workspace:*' },
          name: '@scope/ui',
        },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }),
    ).toEqual([
      {
        packageDir: join(root, 'packages', 'node-runtime'),
        packageName: '@scope/node',
        requiredBy: '@scope/ui',
        sourceFiles: [join(root, 'packages', 'node-runtime', 'src', 'read.ts')],
      },
    ]);
  });
});
