import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { readPublicPackages, snapshotPathFor } from './api-surface-config.mjs';

const scaffold = ({ manifests = {}, publishing }) => {
  const root = mkdtempSync(join(tmpdir(), 'api-surface-config-'));
  writeFileSync(
    join(root, 'devkit.config.json'),
    JSON.stringify({ publishing }),
  );
  for (const [directory, manifest] of Object.entries(manifests)) {
    mkdirSync(join(root, directory), { recursive: true });
    writeFileSync(
      join(root, directory, 'package.json'),
      JSON.stringify(manifest),
    );
  }
  return root;
};

describe('readPublicPackages', () => {
  it('resolves a rostered package against the configured packages directory', () => {
    const root = scaffold({
      manifests: {
        'workspaces/thing': {
          exports: { '.': './src/index.ts' },
          name: '@scope/thing',
        },
      },
      publishing: { packagesDir: 'workspaces', publicPackageDirs: ['thing'] },
    });

    const [only] = readPublicPackages(root);

    expect(only.name).toBe('@scope/thing');
    expect(only.directory).toBe('workspaces/thing');
    expect(only.source).toBe(true);
    expect(only.entries).toEqual([
      {
        entryFile: join(root, 'workspaces/thing', './src/index.ts'),
        subpath: '.',
      },
    ]);
  });

  it('names the config when an entry repeats the packages directory', () => {
    const root = scaffold({
      manifests: { 'packages/thing': { name: '@scope/thing' } },
      publishing: { publicPackageDirs: ['packages/thing'] },
    });

    expect(() => readPublicPackages(root)).toThrow(
      /`publishing.publicPackageDirs` names `packages\/thing`.*no manifest at `packages\/packages\/thing\/package\.json`.*directory name under `publishing\.packagesDir`/s,
    );
  });

  it('names the config for an entry that is simply absent', () => {
    const root = scaffold({ publishing: { publicPackageDirs: ['gone'] } });

    expect(() => readPublicPackages(root)).toThrow(
      /`publishing.publicPackageDirs` names `gone`/,
    );
  });

  it('names the config and the manifest when a rostered package has no name', () => {
    for (const publicPackageDirs of [['b'], ['a', 'b']]) {
      const root = scaffold({
        manifests: {
          'packages/a': {
            exports: { '.': './src/index.ts' },
            name: '@scope/a',
          },
          'packages/b': { exports: { '.': './src/index.ts' } },
        },
        publishing: { publicPackageDirs },
      });

      expect(() => readPublicPackages(root)).toThrow(
        /`publishing\.publicPackageDirs` names `b`.*`packages\/b\/package\.json` declares the name undefined.*`@scope\/name` or `name`/s,
      );
    }
  });

  it('an empty roster reads as empty, for the callers that refuse it', () => {
    const root = scaffold({ publishing: { publicPackageDirs: [] } });

    expect(readPublicPackages(root)).toEqual([]);
  });
});

describe('snapshotPathFor', () => {
  it('drops the scope of any package, and files under the configured directory', () => {
    const root = scaffold({
      publishing: { apiSurfaceDir: 'artifacts/surface' },
    });

    expect(snapshotPathFor('@anyone/thing', root)).toBe(
      'artifacts/surface/thing.txt',
    );
    expect(snapshotPathFor('unscoped', root)).toBe(
      'artifacts/surface/unscoped.txt',
    );
  });

  it('refuses a name that would write outside the snapshot directory', () => {
    const root = scaffold({ publishing: {} });

    for (const name of ['@scope/../x', '@scope/a/b', 'a/b']) {
      expect(() => snapshotPathFor(name, root)).toThrow(/not a package name/);
    }
  });

  it('refuses a Windows traversal read on any platform', () => {
    const root = scaffold({ publishing: {} });

    expect(() => snapshotPathFor(String.raw`..\..\x`, root)).toThrow(
      /not a package name/,
    );
    expect(() => snapshotPathFor(String.raw`@a/b\c`, root)).toThrow(
      /not a package name/,
    );
  });

  it('refuses a manifest with no usable name at all', () => {
    const root = scaffold({ publishing: {} });

    expect(() => snapshotPathFor(undefined, root)).toThrow(
      /not a package name/,
    );
    expect(() => snapshotPathFor('', root)).toThrow(/not a package name/);
  });
});
