import { describe, expect, it } from 'vite-plus/test';

import { formatProblem, relevantProblems } from './attw-check.mjs';

// The three built packages are ESM-only, so attw's legacy `node10` and
// `node16-cjs` findings are expected by design — failing on them would make the
// gate permanently red. Only modern ESM / bundler resolution (and findings with
// no resolution mode at all) reflect a break a real consumer would hit. See
// verify-attw.mjs and ADR-038.

describe('relevantProblems', () => {
  it('drops the expected legacy ESM-only findings', () => {
    const problems = [
      { entrypoint: './x', kind: 'NoResolution', resolutionKind: 'node10' },
      {
        entrypoint: './x',
        kind: 'CJSResolvesToESM',
        resolutionKind: 'node16-cjs',
      },
    ];
    expect(relevantProblems(problems)).toEqual([]);
  });

  it('keeps a break under a modern resolution mode', () => {
    const problem = {
      entrypoint: './x',
      kind: 'NoResolution',
      resolutionKind: 'node16-esm',
    };
    expect(relevantProblems([problem])).toEqual([problem]);
  });

  it('keeps a problem with no resolution mode', () => {
    const problem = { entrypoint: './x', kind: 'NoTypes' };
    expect(relevantProblems([problem])).toEqual([problem]);
  });
});

describe('formatProblem', () => {
  it('renders kind, entrypoint and resolution mode', () => {
    expect(
      formatProblem({
        entrypoint: './x',
        kind: 'NoResolution',
        resolutionKind: 'node16-esm',
      }),
    ).toBe('  NoResolution at ./x (node16-esm)');
  });

  it('omits absent fields', () => {
    expect(formatProblem({ kind: 'NoTypes' })).toBe('  NoTypes');
  });
});
