import { describe, expect, it } from 'vite-plus/test';

import { areAllGroupsCollapsed } from './areAllGroupsCollapsed.util';

describe('areAllGroupsCollapsed', () => {
  it('is true only once every foldable group is in the collapsed set', () => {
    const foldableGroupPaths = new Set(['berlin', 'paris']);

    expect(
      areAllGroupsCollapsed({
        collapsedGroupPaths: new Set(['berlin']),
        foldableGroupPaths,
      }),
    ).toBe(false);
    expect(
      areAllGroupsCollapsed({
        collapsedGroupPaths: new Set(['berlin', 'paris']),
        foldableGroupPaths,
      }),
    ).toBe(true);
  });

  it('compares membership, not size', () => {
    // A collapse survives a refetch by path (ADR-061) and is only pruned on a
    // read, so between two reads the collapsed set can name a group the rows no
    // longer hold. Same size, different sets: a size check would report the
    // grid fully folded and leave the control dead on an open group.
    expect(
      areAllGroupsCollapsed({
        collapsedGroupPaths: new Set(['a-group-that-left']),
        foldableGroupPaths: new Set(['berlin']),
      }),
    ).toBe(false);
  });

  it('ignores a collapsed path that is not foldable here', () => {
    expect(
      areAllGroupsCollapsed({
        collapsedGroupPaths: new Set(['berlin', 'somewhere-else']),
        foldableGroupPaths: new Set(['berlin']),
      }),
    ).toBe(true);
  });
});
