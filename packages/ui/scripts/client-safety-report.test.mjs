import { readFileSync } from 'node:fs';
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
import {
  CLEAN_SOURCE,
  scaffoldWithConsumer,
  SERVER_ONLY_SOURCE,
} from './lib/client-safety-fixtures.mjs';

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
      `- @scope/node is a dependency of @scope/ui, and ${join(root, 'packages', 'node-runtime', 'src', 'read.ts')} imports node:fs`,
    );
  });

  it('fails on a server-only import two edges out, in a package this one never declares', () => {
    const { manifest, publicApiFilePath, root, workspaceDirectories } =
      scaffoldWithConsumer({
        dependencies: { '@scope/api': 'workspace:*' },
        packages: [
          {
            dependencies: { '@scope/node': 'workspace:*' },
            directory: 'api',
            name: '@scope/api',
            sources: { 'one.ts': CLEAN_SOURCE },
          },
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
      `- @scope/node is a dependency of @scope/api, and ${join(root, 'packages', 'node-runtime', 'src', 'read.ts')} imports node:fs`,
    );
  });

  it('passes a dependency whose only server-only import sits in a test it never publishes', () => {
    const { manifest, publicApiFilePath, workspaceDirectories } =
      scaffoldWithConsumer({
        dependencies: { '@scope/utils': 'workspace:*' },
        packages: [
          {
            directory: 'utils',
            files: ['src', '!src/**/*.test.*'],
            name: '@scope/utils',
            sources: {
              'merge.test.ts': SERVER_ONLY_SOURCE,
              'merge.ts': CLEAN_SOURCE,
            },
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

  it('still fails on that import once it sits in a file the same package publishes', () => {
    const { manifest, publicApiFilePath, root, workspaceDirectories } =
      scaffoldWithConsumer({
        dependencies: { '@scope/utils': 'workspace:*' },
        packages: [
          {
            directory: 'utils',
            files: ['src', '!src/**/*.test.*'],
            name: '@scope/utils',
            sources: {
              'merge.test.ts': CLEAN_SOURCE,
              'merge.ts': SERVER_ONLY_SOURCE,
            },
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
      `- @scope/utils is a dependency of @scope/ui, and ${join(root, 'packages', 'utils', 'src', 'merge.ts')} imports node:fs`,
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

  const workspaceDirectories = buildWorkspaceDirectoryIndex(repoRoot);
  const readPackageManifest = (packageDir) =>
    JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
  const uiManifest = readPackageManifest(uiRootDir);
  const scanUi = () =>
    scanWorkspaceDependencies({
      manifest: uiManifest,
      workspaceDirectories,
    });

  it('opens every workspace dependency packages/ui really declares', () => {
    const scans = scanUi();

    expect(scans.map(({ packageName }) => packageName)).toEqual(
      expect.arrayContaining(
        Object.entries(uiManifest.dependencies)
          .filter(([, versionSpec]) => versionSpec.startsWith('workspace:'))
          .map(([name]) => name),
      ),
    );
    expect(scans.length).toBeGreaterThan(0);
    expect(collectScanDefects(scans)).toEqual([]);
  });

  it('closes over the workspace dependencies of every package it scans', () => {
    const scans = scanUi();

    const reachable = scans.flatMap(({ packageDir }) =>
      selectWorkspaceDependencies({
        manifest: readPackageManifest(packageDir),
        workspaceDirectories,
      }).map(({ packageName }) => packageName),
    );

    expect(scans.map(({ packageName }) => packageName)).toEqual(
      expect.arrayContaining(reachable),
    );
  });

  it('reads none of the colocated tests those packages exclude from `files`', () => {
    const scans = scanUi();

    expect(
      scans
        .flatMap(({ sourceFiles }) => sourceFiles)
        .filter((filePath) => /\.test\.[^/]+$/.test(filePath)),
    ).toEqual([]);
    expect(
      scans.every(({ packageDir }) =>
        (readPackageManifest(packageDir).files ?? []).includes(
          '!src/**/*.test.*',
        ),
      ),
    ).toBe(true);
  });
});
