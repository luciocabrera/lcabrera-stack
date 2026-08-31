import { describe, expect, it } from 'vite-plus/test';

import { isGroupCollapsed } from './isGroupCollapsed.util';

const run = ({
  defaultFold,
  toggled,
}: {
  readonly defaultFold: 'collapsed' | 'expanded';
  readonly toggled: readonly string[];
}) =>
  isGroupCollapsed({
    defaultFold,
    pathKey: '["a"]',
    toggledGroupPaths: new Set(toggled),
  });

describe('isGroupCollapsed', () => {
  it('reads membership as collapsed under the expanded default', () => {
    expect(run({ defaultFold: 'expanded', toggled: ['["a"]'] })).toBe(true);
    expect(run({ defaultFold: 'expanded', toggled: [] })).toBe(false);
  });

  it('reads membership as expanded under the collapsed default', () => {
    expect(run({ defaultFold: 'collapsed', toggled: ['["a"]'] })).toBe(false);
    expect(run({ defaultFold: 'collapsed', toggled: [] })).toBe(true);
  });

  it('answers for a group the set has never named, either way', () => {
    expect(run({ defaultFold: 'collapsed', toggled: ['["b"]'] })).toBe(true);
    expect(run({ defaultFold: 'expanded', toggled: ['["b"]'] })).toBe(false);
  });
});
