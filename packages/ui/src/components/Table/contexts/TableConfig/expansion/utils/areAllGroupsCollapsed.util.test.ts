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
