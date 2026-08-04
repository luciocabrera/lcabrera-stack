/**
 * Merge order is the half of the policy with no red check behind it: getting it
 * wrong produces a merge that succeeds and is wrong, so the properties pinned
 * here are the ones nothing downstream would catch — stack edges beating
 * inference, and the sort being total so two passes agree.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  declaredEdges,
  deriveOrder,
  descendants,
  isSnapshot,
  overlapEdges,
  snapshotEdges,
  stackEdges,
  topoSort,
} from './pr-queue-order.mjs';

const pr = (number, overrides = {}) => ({
  baseRefName: 'main',
  body: '',
  files: [{ additions: 5, deletions: 0, path: `src/${number}.ts` }],
  headRefName: `feat/${number}`,
  number,
  size: 5,
  ...overrides,
});

describe('stackEdges — O1', () => {
  it('orders a stacked PR after the branch it targets', () => {
    const queue = [
      pr(1, { headRefName: 'feat/base' }),
      pr(2, { baseRefName: 'feat/base' }),
    ];
    expect(stackEdges(queue)).toEqual([{ from: 1, rule: 'O1', to: 2 }]);
  });

  it('adds nothing when everything targets main', () => {
    expect(stackEdges([pr(1), pr(2)])).toEqual([]);
  });
});

describe('declaredEdges — O2', () => {
  it('reads every declaration form the policy names', () => {
    const queue = [
      pr(1),
      pr(2, { body: 'Depends on #1' }),
      pr(3, { body: 'Blocked by #1\nStacked on #2' }),
      pr(4, { body: 'after #3 lands' }),
    ];
    expect(declaredEdges(queue)).toEqual([
      { from: 1, rule: 'O2', to: 2 },
      { from: 1, rule: 'O2', to: 3 },
      { from: 2, rule: 'O2', to: 3 },
      { from: 3, rule: 'O2', to: 4 },
    ]);
  });

  it('ignores a reference to a PR that is not open', () => {
    expect(declaredEdges([pr(2, { body: 'Depends on #99' })])).toEqual([]);
  });

  it('ignores a self-reference rather than building a one-node cycle', () => {
    expect(declaredEdges([pr(2, { body: 'Depends on #2' })])).toEqual([]);
  });
});

describe('overlapEdges — O3, smaller diff first', () => {
  const shared = (number, size) => ({
    ...pr(number, {
      files: [{ additions: size, deletions: 0, path: 'shared.ts' }],
    }),
    size,
  });

  it('lets the larger PR absorb the rebase', () => {
    expect(overlapEdges([shared(1, 400), shared(2, 10)])).toEqual([
      { from: 2, rule: 'O3', to: 1 },
    ]);
  });

  it('breaks a size tie on PR number so the order is total', () => {
    expect(overlapEdges([shared(7, 10), shared(3, 10)])).toEqual([
      { from: 3, rule: 'O3', to: 7 },
    ]);
  });

  it('adds no edge when the PRs touch nothing in common', () => {
    expect(overlapEdges([pr(1), pr(2)])).toEqual([]);
  });
});

describe('snapshotEdges — O4', () => {
  const sweep = pr(9, {
    files: [
      { additions: 0, deletions: 12, path: 'docs/coordination/tasks/a.md' },
    ],
  });
  const claim = pr(8, {
    files: [
      { additions: 20, deletions: 0, path: 'docs/coordination/tasks/b.md' },
    ],
  });

  it('recognises a delete-only register sweep', () => {
    expect(isSnapshot(sweep)).toBe(true);
    expect(isSnapshot(claim)).toBe(false);
  });

  it('orders the sweep after the PR sharing its directory', () => {
    expect(snapshotEdges([claim, sweep])).toEqual([
      { from: 8, rule: 'O4', to: 9 },
    ]);
  });

  it('adds nothing between two PRs in unrelated directories', () => {
    expect(snapshotEdges([sweep, pr(3)])).toEqual([]);
  });
});

describe('topoSort — O5 and cycles', () => {
  it('is deterministic: ascending PR number among ready nodes', () => {
    expect(topoSort([5, 2, 9], []).order).toEqual([2, 5, 9]);
  });

  it('respects edges over the numeric tiebreak', () => {
    expect(topoSort([1, 2], [{ from: 2, rule: 'O1', to: 1 }]).order).toEqual([
      2, 1,
    ]);
  });

  it('reports every PR in a cycle rather than inventing an order', () => {
    const { cycle, order } = topoSort(
      [1, 2, 3],
      [
        { from: 1, rule: 'O2', to: 2 },
        { from: 2, rule: 'O2', to: 1 },
      ],
    );
    expect(order).toEqual([3]);
    expect(cycle).toEqual([1, 2]);
  });

  it('ignores an edge pointing outside the queue', () => {
    expect(topoSort([1], [{ from: 42, rule: 'O2', to: 1 }]).order).toEqual([1]);
  });
});

describe('descendants — §1 escalation propagation', () => {
  it('reaches transitively and excludes the root itself', () => {
    const edges = [
      { from: 1, rule: 'O1', to: 2 },
      { from: 2, rule: 'O1', to: 3 },
    ];
    expect([...descendants(edges, [1])]).toEqual([2, 3]);
  });

  it('terminates on a cyclic graph instead of looping forever', () => {
    const edges = [
      { from: 1, rule: 'O2', to: 2 },
      { from: 2, rule: 'O2', to: 1 },
    ];
    expect([...descendants(edges, [1])].sort((a, b) => a - b)).toEqual([1, 2]);
  });
});

describe('deriveOrder', () => {
  it('combines every rule into one sorted result', () => {
    const queue = [
      pr(1, { headRefName: 'feat/base' }),
      pr(2, { baseRefName: 'feat/base' }),
      pr(3),
    ];
    const { cycle, edges, order } = deriveOrder(queue);
    expect(cycle).toEqual([]);
    expect(edges).toContainEqual({ from: 1, rule: 'O1', to: 2 });
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(2));
  });
});
