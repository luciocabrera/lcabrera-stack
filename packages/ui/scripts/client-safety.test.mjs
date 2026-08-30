import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  buildWorkspaceDirectoryIndex,
  collectClientSafetyReport,
  collectScanDefects,
  scanWorkspaceDependencies,
  selectWorkspaceDependencies,
} from './client-safety.mjs';

const scaffold = (packages) => {
  const root = mkdtempSync(join(tmpdir(), 'ui-client-safety-'));
  writeFileSync(
    join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - packages/*\n',
  );

  for (const { directory, name, sources = {} } of packages) {
    const packageDir = join(root, 'packages', directory);
    mkdirSync(join(packageDir, 'src'), { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), JSON.stringify({ name }));

    for (const [fileName, text] of Object.entries(sources)) {
      writeFileSync(join(packageDir, 'src', fileName), text);
    }
  }

  return root;
};

const CLEAN_SOURCE = 'export const one = 1;\n';
const SERVER_ONLY_SOURCE = "import { readFileSync } from 'node:fs';\n";

const scaffoldWithConsumer = ({ dependencies, packages, publicApi }) => {
  const root = scaffold([
    {
      directory: 'ui',
      name: '@scope/ui',
      sources: { 'public-api.ts': publicApi },
    },
    ...packages,
  ]);

  return {
    manifest: { dependencies, name: '@scope/ui' },
    publicApiFilePath: join(root, 'packages', 'ui', 'src', 'public-api.ts'),
    root,
    workspaceDirectories: buildWorkspaceDirectoryIndex(root),
  };
};

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

describe('collectScanDefects', () => {
  it('reports the empty dependency set — a scan of nothing is not a clean run', () => {
    expect(collectScanDefects([])).toEqual([
      expect.stringContaining('no workspace dependency was selected'),
    ]);
  });

  it('reports a dependency the roster could not place', () => {
    expect(
      collectScanDefects([
        { packageDir: null, packageName: '@scope/ghost', sourceFiles: [] },
      ]),
    ).toEqual([expect.stringContaining('@scope/ghost')]);
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
        manifest: { dependencies: { '@scope/node': 'workspace:*' } },
        workspaceDirectories: buildWorkspaceDirectoryIndex(root),
      }),
    ).toEqual([
      {
        packageDir: join(root, 'packages', 'node-runtime'),
        packageName: '@scope/node',
        sourceFiles: [join(root, 'packages', 'node-runtime', 'src', 'read.ts')],
      },
    ]);
  });
});

describe('collectClientSafetyReport', () => {
  it('names the packages it scanned when everything is client-safe', () => {
    const { manifest, publicApiFilePath, workspaceDirectories } =
      scaffoldWithConsumer({
        dependencies: { '@scope/utils': 'workspace:*' },
        packages: [
          {
            directory: 'utils',
            name: '@scope/utils',
            sources: { 'one.ts': CLEAN_SOURCE },
          },
        ],
        publicApi: CLEAN_SOURCE,
      });

    expect(
      collectClientSafetyReport({
        manifest,
        publicApiFilePath,
        workspaceDirectories,
      }),
    ).toEqual({ reportLines: [], scannedPackageNames: ['@scope/utils'] });
  });

  it('fails on a server-only import in a workspace dependency whose directory differs from its name', () => {
    const { manifest, publicApiFilePath, root, workspaceDirectories } =
      scaffoldWithConsumer({
        dependencies: { '@scope/node': 'workspace:*' },
        packages: [
          {
            directory: 'node-runtime',
            name: '@scope/node',
            sources: { 'read.ts': SERVER_ONLY_SOURCE },
          },
        ],
        publicApi: CLEAN_SOURCE,
      });

    expect(
      collectClientSafetyReport({
        manifest,
        publicApiFilePath,
        workspaceDirectories,
      }).reportLines,
    ).toContain(
      `- @scope/node is a dependency, and ${join(root, 'packages', 'node-runtime', 'src', 'read.ts')} imports node:fs`,
    );
  });

  it('fails when the manifest declares no workspace dependency at all', () => {
    const { manifest, publicApiFilePath, workspaceDirectories } =
      scaffoldWithConsumer({
        dependencies: { isbot: '^5.0.0' },
        packages: [
          {
            directory: 'utils',
            name: '@scope/utils',
            sources: { 'one.ts': CLEAN_SOURCE },
          },
        ],
        publicApi: CLEAN_SOURCE,
      });

    const { reportLines, scannedPackageNames } = collectClientSafetyReport({
      manifest,
      publicApiFilePath,
      workspaceDirectories,
    });

    expect(scannedPackageNames).toEqual([]);
    expect(reportLines).toContain(
      '- no workspace dependency was selected, so the closure was never opened — a scan of nothing is not a pass',
    );
  });

  it('still fails on a server-only import reached from the public API itself', () => {
    const { manifest, publicApiFilePath, workspaceDirectories } =
      scaffoldWithConsumer({
        dependencies: { '@scope/utils': 'workspace:*' },
        packages: [
          {
            directory: 'utils',
            name: '@scope/utils',
            sources: { 'one.ts': CLEAN_SOURCE },
          },
        ],
        publicApi: SERVER_ONLY_SOURCE,
      });

    expect(
      collectClientSafetyReport({
        manifest,
        publicApiFilePath,
        workspaceDirectories,
      }).reportLines,
    ).toContain(`- ${publicApiFilePath} imports node:fs`);
  });
});

describe('the guard as this repository wires it', () => {
  const uiRootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const repoRoot = resolve(uiRootDir, '..', '..');

  it('opens every workspace dependency packages/ui really declares', () => {
    const manifest = JSON.parse(
      readFileSync(join(uiRootDir, 'package.json'), 'utf8'),
    );

    const scans = scanWorkspaceDependencies({
      manifest,
      workspaceDirectories: buildWorkspaceDirectoryIndex(repoRoot),
    });

    expect(scans.map(({ packageName }) => packageName)).toEqual(
      Object.entries(manifest.dependencies)
        .filter(([, versionSpec]) => versionSpec.startsWith('workspace:'))
        .map(([name]) => name),
    );
    expect(scans.length).toBeGreaterThan(0);
    expect(collectScanDefects(scans)).toEqual([]);
  });
});
