import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  buildPublishExports,
  diffSubpaths,
  isBuiltPublicPackage,
  isPublishedTargetCorrect,
  toBuiltPaths,
} from './publish-surface.mjs';

// The invariant these assertions defend: what consumers install must match what
// this repo develops against. `exports` points at `src` so no workspace has to
// build before it can typecheck; `publishConfig.exports` points at `dist`
// because Node refuses to strip types under `node_modules`. Only the first map
// is ever exercised here, so drift in the second is invisible until someone
// installs the package.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const readManifest = (directory) =>
  JSON.parse(
    readFileSync(
      join(REPO_ROOT, 'packages', directory, 'package.json'),
      'utf8',
    ),
  );

describe('toBuiltPaths', () => {
  it('rewrites a source target onto its built pair', () => {
    expect(toBuiltPaths('./src/arrays/merge-arrays.util.ts')).toEqual({
      default: './dist/arrays/merge-arrays.util.mjs',
      types: './dist/arrays/merge-arrays.util.d.mts',
    });
  });

  it('handles .tsx sources', () => {
    expect(toBuiltPaths('./src/entry/handler.tsx').default).toBe(
      './dist/entry/handler.mjs',
    );
  });

  it('only rewrites a leading ./src/, never a nested one', () => {
    // A `src` segment deeper in the path is part of the module's own layout.
    expect(toBuiltPaths('./src/db/src-helpers/parse.util.ts').default).toBe(
      './dist/db/src-helpers/parse.util.mjs',
    );
  });
});

describe('isBuiltPublicPackage', () => {
  it('requires both a build script and public access', () => {
    const built = {
      publishConfig: { access: 'public' },
      scripts: { build: 'vp pack' },
    };

    expect(isBuiltPublicPackage(built)).toBe(true);
    expect(isBuiltPublicPackage({ ...built, scripts: {} })).toBe(false);
    expect(isBuiltPublicPackage({ ...built, publishConfig: {} })).toBe(false);
    expect(isBuiltPublicPackage({})).toBe(false);
  });

  it('excludes packages/ui, which ships source', () => {
    // ui cannot be prebuilt: StyleX derives theme identity from the source path,
    // so a consumer's own plugin has to compile it. If it ever gains a `build`
    // script this test should fail loudly rather than the gate silently
    // demanding a dist/ that must not exist.
    expect(isBuiltPublicPackage(readManifest('ui'))).toBe(false);
  });

  it('includes every package that does build', () => {
    for (const directory of ['api', 'server', 'utils']) {
      expect(isBuiltPublicPackage(readManifest(directory))).toBe(true);
    }
  });
});

describe('diffSubpaths', () => {
  it('reports a subpath missing from the published map', () => {
    expect(
      diffSubpaths({ published: ['./a'], source: ['./a', './b'] }),
    ).toEqual({ extra: [], missing: ['./b'] });
  });

  it('reports a published subpath that no longer exists in source', () => {
    expect(
      diffSubpaths({ published: ['./a', './gone'], source: ['./a'] }),
    ).toEqual({ extra: ['./gone'], missing: [] });
  });
});

describe('isPublishedTargetCorrect', () => {
  const sourceTarget = './src/x.util.ts';

  it('accepts the exact built pair', () => {
    expect(
      isPublishedTargetCorrect({
        published: toBuiltPaths(sourceTarget),
        sourceTarget,
      }),
    ).toBe(true);
  });

  it('rejects a published entry with no types', () => {
    // A missing `types` degrades silently: the import resolves and every symbol
    // is `any`, so nothing fails until a consumer trusts a wrong signature.
    expect(
      isPublishedTargetCorrect({
        published: { default: './dist/x.util.mjs' },
        sourceTarget,
      }),
    ).toBe(false);
  });

  it('rejects an entry still pointing at source', () => {
    expect(
      isPublishedTargetCorrect({
        published: { default: sourceTarget, types: sourceTarget },
        sourceTarget,
      }),
    ).toBe(false);
  });
});

describe('buildPublishExports', () => {
  it('maps every subpath and preserves order', () => {
    const built = buildPublishExports({
      './b': './src/b.util.ts',
      './a': './src/a.util.ts',
    });

    expect(Object.keys(built)).toEqual(['./b', './a']);
    expect(built['./a'].types).toBe('./dist/a.util.d.mts');
  });

  it('reproduces every built package committed publishConfig.exports', () => {
    // Catches a hand-edit to package.json that the generator would not produce.
    for (const directory of ['api', 'server', 'utils']) {
      const manifest = readManifest(directory);

      expect(buildPublishExports(manifest.exports)).toEqual(
        manifest.publishConfig.exports,
      );
      expect(manifest.files).toContain('dist');
    }
  });
});

describe('repo wiring', () => {
  it('gitignores dist so a build is never committed', () => {
    const ignored = readFileSync(join(REPO_ROOT, '.gitignore'), 'utf8');

    expect(ignored.split('\n')).toContain('dist');
  });
});
