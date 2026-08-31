import { describe, expect, it } from 'vite-plus/test';

import { overlapWarnings } from './coordination-overlap.mjs';

const task = ({ area, branch, id, name, status = 'active' }) => ({
  data: { area, branch, id, status },
  name: name ?? `${id}.md`,
});

describe('overlapWarnings', () => {
  it('warns when two live tasks on different branches claim the same area', () => {
    const warnings = overlapWarnings([
      task({ area: ['packages/ui/**'], branch: 'feat-a', id: 'a' }),
      task({ area: ['packages/ui/**'], branch: 'feat-b', id: 'b' }),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('a.md and b.md');
    expect(warnings[0]).toContain('packages/ui/**');
  });

  it('stays quiet when the two tasks share a branch', () => {
    const warnings = overlapWarnings([
      task({ area: ['packages/ui/**'], branch: 'shared', id: 'a' }),
      task({ area: ['packages/ui/**'], branch: 'shared', id: 'b' }),
    ]);

    expect(warnings).toEqual([]);
  });

  it('treats placeholder branches as distinct, not as one shared branch', () => {
    const warnings = overlapWarnings([
      task({ area: ['scripts/**'], branch: '(uncommitted)', id: 'a' }),
      task({ area: ['scripts/**'], branch: '(uncommitted)', id: 'b' }),
    ]);

    expect(warnings).toHaveLength(1);
  });

  it('ignores tasks that are done', () => {
    const warnings = overlapWarnings([
      task({ area: ['scripts/**'], branch: 'x', id: 'a', status: 'done' }),
      task({ area: ['scripts/**'], branch: 'y', id: 'b' }),
    ]);

    expect(warnings).toEqual([]);
  });

  it('does not warn on disjoint areas', () => {
    const warnings = overlapWarnings([
      task({ area: ['packages/ui/**'], branch: 'x', id: 'a' }),
      task({ area: ['packages/server/**'], branch: 'y', id: 'b' }),
    ]);

    expect(warnings).toEqual([]);
  });

  it('warns for a claim read off another branch — the point of #233', () => {
    const warnings = overlapWarnings([
      task({ area: ['scripts/lib/**'], branch: 'mine', id: 'mine' }),
      task({
        area: ['scripts/**'],
        branch: 'theirs',
        id: 'theirs',
        name: 'theirs.md (branch theirs)',
      }),
    ]);

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('(branch theirs)');
  });

  it('survives a task whose area field is missing', () => {
    expect(() =>
      overlapWarnings([
        task({ area: undefined, branch: 'x', id: 'a' }),
        task({ area: ['scripts/**'], branch: 'y', id: 'b' }),
      ]),
    ).not.toThrow();
  });
});
