import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { readPublicPackages, snapshotPathFor } from './api-surface-config.mjs';

// A roster entry is a directory name under `publishing.packagesDir`. Spelling it
// as a path from the repository root passes validation — it is a perfectly good
// repo-relative string — and only fails at the read, which is why the read has
// to name the config rather than the directory it could not find.

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
    // No `build` script, so it ships source and the entry is the source file.
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

  // A single-entry roster never runs the sort comparator, so a nameless manifest
  // used to travel on as `{ name: undefined }` with nothing said. Both sizes are
  // asserted because only the two-entry one failed loudly before, and it failed
  // as a bare `localeCompare` TypeError naming neither the config nor the file.
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
  // Any scope, not one this package knows. Left whole, `@scope/thing.txt` would
  // put a separator in the filename and write outside the snapshot directory.
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

  // The result is concatenated into a path that `--write` writes to, so the name
  // is held to the same rule as a configured location. A manifest is no more
  // trusted an origin than a config file — both are text somebody edited.
  it('refuses a name that would write outside the snapshot directory', () => {
    const root = scaffold({ publishing: {} });

    for (const name of ['@scope/../x', '@scope/a/b', 'a/b']) {
      expect(() => snapshotPathFor(name, root)).toThrow(/not a package name/);
    }
  });

  // Backslash is refused wherever it appears, not only where it separates: the
  // verdict must not depend on which platform reads it. That is the containment
  // guard's own history — it was inert on Windows until it stopped relying on
  // the platform's semantics.
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
