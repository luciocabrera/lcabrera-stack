import { describe, expect, it } from 'vite-plus/test';

import { countCollapsedGroups } from './countCollapsedGroups.util';

const foldableGroupPaths = new Set(['["a"]', '["b"]', '["c"]']);

describe('countCollapsedGroups', () => {
  it('counts the set itself under an expanded default', () => {
    expect(
      countCollapsedGroups({
        defaultFold: 'expanded',
        foldableGroupPaths,
        toggledGroupPaths: new Set(['["a"]', '["b"]']),
      }),
    ).toBe(2);
  });

  it('counts the complement under a collapsed default', () => {
    expect(
      countCollapsedGroups({
        defaultFold: 'collapsed',
        foldableGroupPaths,
        toggledGroupPaths: new Set(['["a"]', '["b"]']),
      }),
    ).toBe(1);
  });

  it('reports a fully folded grid from an empty set under a collapsed default', () => {
    expect(
      countCollapsedGroups({
        defaultFold: 'collapsed',
        foldableGroupPaths,
        toggledGroupPaths: new Set(),
      }),
    ).toBe(foldableGroupPaths.size);
  });

  it('ignores a toggled path that is not foldable at all', () => {
    expect(
      countCollapsedGroups({
        defaultFold: 'expanded',
        foldableGroupPaths,
        toggledGroupPaths: new Set(['["a"]', '["gone"]']),
      }),
    ).toBe(1);
  });
});
