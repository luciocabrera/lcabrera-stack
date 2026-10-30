import { describe, expect, it } from 'vite-plus/test';

import {
  ANALYSES,
  fallowArgs,
  mutationArgs,
  mutationRoots,
  NEEDS_BASE,
  sourceFiles,
  toRepoPath,
  verdictSource,
} from './fallow-gate.mjs';

describe('ANALYSES', () => {
  it('names every analysis the gate runs, sorted', () => {
    expect(ANALYSES).toEqual([
      'architecture',
      'coverage-gaps',
      'guard',
      'mutation',
      'security',
      'similar-code',
      'suppressions',
    ]);
  });

  it('asks for a merge base only where the changed lines are gated', () => {
    expect(NEEDS_BASE).toEqual(
      new Set(['coverage-gaps', 'mutation', 'security']),
    );
  });
});

describe('verdictSource', () => {
  it.each([
    ['architecture', 'exit-code'],
    ['guard', 'exit-code'],
    ['security', 'exit-code'],
    ['coverage-gaps', 'report'],
    ['similar-code', 'report'],
    ['suppressions', 'report'],
    ['mutation', 'mutation'],
  ])('%s is judged by its %s', (analysis, source) => {
    expect(verdictSource(analysis)).toBe(source);
  });
});

describe('toRepoPath', () => {
  it('makes an absolute path relative to the root', () => {
    expect(toRepoPath({ file: '/repo/packages/a/b.ts', root: '/repo' })).toBe(
      'packages/a/b.ts',
    );
  });

  it('keeps a path that is already relative', () => {
    expect(toRepoPath({ file: 'packages/a/b.ts', root: '/repo' })).toBe(
      'packages/a/b.ts',
    );
  });
});

describe('sourceFiles', () => {
  it('keeps the files fallow analyses, once each, sorted', () => {
    expect(
      sourceFiles([
        'b.tsx',
        'a.ts',
        'README.md',
        'a.ts',
        'c.mjs',
        'd.cjs',
        'e.mts',
        'f.cts',
        'g.jsx',
        'h.js',
        'i.vue',
        'j.svelte',
        'k.astro',
        'package.json',
        'styles.css',
      ]),
    ).toEqual([
      'a.ts',
      'b.tsx',
      'c.mjs',
      'd.cjs',
      'e.mts',
      'f.cts',
      'g.jsx',
      'h.js',
      'i.vue',
      'j.svelte',
      'k.astro',
    ]);
  });

  it('reads the extension at the end of the name only', () => {
    expect(sourceFiles(['a.ts.md', 'a.tsx.snap'])).toEqual([]);
  });
});

describe('fallowArgs', () => {
  const files = ['a.ts', 'b.tsx'];

  it('scopes architecture to the files', () => {
    expect(fallowArgs({ analysis: 'architecture', files })).toEqual([
      'architecture',
      '--quiet',
      '--file',
      'a.ts',
      '--file',
      'b.tsx',
    ]);
  });

  it('hands guard the files as arguments', () => {
    expect(fallowArgs({ analysis: 'guard', files })).toEqual([
      'guard',
      '--quiet',
      'a.ts',
      'b.tsx',
    ]);
  });

  it('gates security on the lines changed since the base', () => {
    expect(fallowArgs({ analysis: 'security', base: 'abc', files })).toEqual([
      'security',
      '--quiet',
      '--gate',
      'new',
      '--changed-since',
      'abc',
    ]);
  });

  it('reads coverage gaps as JSON, filtered later', () => {
    expect(fallowArgs({ analysis: 'coverage-gaps', files })).toEqual([
      'health',
      '--coverage-gaps',
      '--format',
      'json',
      '--quiet',
    ]);
  });

  it.each(['similar-code', 'suppressions'])(
    'reads %s as JSON for the files',
    (analysis) => {
      expect(fallowArgs({ analysis, files })).toEqual([
        analysis,
        '--format',
        'json',
        '--quiet',
        '--file',
        'a.ts',
        '--file',
        'b.tsx',
      ]);
    },
  );

  it('refuses mutation, which runs once per root', () => {
    expect(() => fallowArgs({ analysis: 'mutation', files })).toThrow(
      'no single fallow invocation for "mutation"',
    );
  });
});

describe('mutationArgs', () => {
  it('mutates the changed code of one root and fails below a full score', () => {
    expect(mutationArgs({ base: 'abc', root: 'packages/utils' })).toEqual([
      'mutation',
      '--root',
      'packages/utils',
      '--changed-since',
      'abc',
      '--min-score',
      '100',
      '--allow-dirty',
      '--quiet',
    ]);
  });
});

describe('mutationRoots', () => {
  it('groups files under the workspace that owns them', () => {
    expect(
      mutationRoots({
        files: [
          'packages/ui/src/a.ts',
          'packages/ui-kit/src/b.ts',
          'packages/ui/src/c.ts',
        ],
        workspaceDirs: ['packages/ui', 'packages/ui-kit'],
      }),
    ).toEqual({ roots: ['packages/ui', 'packages/ui-kit'], unrooted: [] });
  });

  it('prefers the deepest workspace when two contain the file', () => {
    expect(
      mutationRoots({
        files: ['packages/outer/inner/src/a.ts'],
        workspaceDirs: ['packages/outer', 'packages/outer/inner'],
      }).roots,
    ).toEqual(['packages/outer/inner']);
  });

  it('roots a file outside every workspace at its top directory', () => {
    expect(
      mutationRoots({
        files: ['scripts/lib/a.mjs', 'scripts/b.mjs'],
        workspaceDirs: ['packages/ui'],
      }),
    ).toEqual({ roots: ['scripts'], unrooted: [] });
  });

  it('leaves a file at the repository root unrooted', () => {
    expect(
      mutationRoots({ files: ['vite.config.ts'], workspaceDirs: [] }),
    ).toEqual({ roots: [], unrooted: ['vite.config.ts'] });
  });
});
