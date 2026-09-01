import { describe, expect, it } from 'vite-plus/test';

import {
  buildPublishExports,
  collectTargets,
  diffSubpaths,
  isBuiltPublicPackage,
  isPublishedTargetCorrect,
  isSourceTarget,
  packedSurfaceProblems,
  toBuiltPaths,
} from './publish-surface.mjs';

// The invariant these assertions defend: what consumers install must match what
// the source tree develops against. `exports` points at `src` so no workspace
// has to build before it can typecheck; `publishConfig.exports` points at
// `dist` because Node refuses to strip types under `node_modules`. Only the
// first map is ever exercised in-tree, so drift in the second is invisible
// until someone installs the package.
//
// That a given repository still satisfies these rules is asserted where the
// repository is — `scripts/lib/publish-wiring.test.mjs` here.

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

  it('handles a .mjs source, which builds like any other entry', () => {
    expect(toBuiltPaths('./src/eslint.custom-rules.shared.config.mjs')).toEqual(
      {
        default: './dist/eslint.custom-rules.shared.config.mjs',
        types: './dist/eslint.custom-rules.shared.config.d.mts',
      },
    );
  });

  it('only rewrites a leading ./src/, never a nested one', () => {
    expect(toBuiltPaths('./src/db/src-helpers/parse.util.ts').default).toBe(
      './dist/db/src-helpers/parse.util.mjs',
    );
  });

  it('writes types before default, the order a resolver reads', () => {
    expect(Object.keys(toBuiltPaths('./src/index.ts'))).toEqual([
      'types',
      'default',
    ]);
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
});

describe('collectTargets', () => {
  it('flattens nested export conditions', () => {
    expect(
      collectTargets({
        import: { default: './dist/x.mjs', types: './dist/x.d.mts' },
        require: './dist/x.cjs',
      }),
    ).toEqual(['./dist/x.mjs', './dist/x.d.mts', './dist/x.cjs']);
  });
});

describe('isSourceTarget', () => {
  it('flags what a consumer cannot load from node_modules', () => {
    expect(isSourceTarget('./src/x.util.ts')).toBe(true);
    expect(isSourceTarget('./dist/x.util.d.mts')).toBe(false);
    expect(isSourceTarget('./dist/x.util.mjs')).toBe(false);
  });
});

describe('packedSurfaceProblems', () => {
  const sourceExports = { './x.util': './src/x.util.ts' };
  const files = ['package.json', 'dist/x.util.mjs', 'dist/x.util.d.mts'];
  const label = 'packages/example';

  it('accepts a tarball whose exports point at files it contains', () => {
    expect(
      packedSurfaceProblems({
        files,
        label,
        packedExports: {
          './x.util': {
            default: './dist/x.util.mjs',
            types: './dist/x.util.d.mts',
          },
        },
        sourceExports,
      }),
    ).toEqual([]);
  });

  it('rejects a tarball still exporting TypeScript source', () => {
    expect(
      packedSurfaceProblems({
        files: [...files, 'src/x.util.ts'],
        label,
        packedExports: sourceExports,
        sourceExports,
      }).join('\n'),
    ).toContain('ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING');
  });

  it('rejects a target the tarball does not contain', () => {
    expect(
      packedSurfaceProblems({
        files: ['package.json', 'dist/x.util.d.mts'],
        label,
        packedExports: {
          './x.util': {
            default: './dist/x.util.mjs',
            types: './dist/x.util.d.mts',
          },
        },
        sourceExports,
      }).join('\n'),
    ).toContain('not in the tarball');
  });

  it('rejects a subpath missing from the packed exports', () => {
    expect(
      packedSurfaceProblems({
        files,
        label,
        packedExports: {},
        sourceExports,
      }).join('\n'),
    ).toContain('absent from the packed tarball');
  });
});
