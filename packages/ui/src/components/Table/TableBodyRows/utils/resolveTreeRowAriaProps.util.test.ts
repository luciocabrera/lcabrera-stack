import { describe, expect, it } from 'vite-plus/test';

import { resolveTreeRowAriaProps } from './resolveTreeRowAriaProps.util';

describe('resolveTreeRowAriaProps', () => {
  it('emits nothing at all when the grid is not a tree', () => {
    // React omits an absent prop, so an ungrouped grid's markup is byte-for-byte
    // what it was before tree semantics existed.
    expect(resolveTreeRowAriaProps(undefined)).toStrictEqual({});
  });

  it('states level, position and set size on every row of a tree', () => {
    expect(
      resolveTreeRowAriaProps({
        hasChildren: false,
        isExpanded: false,
        level: 2,
        levelDisclosures: [],
        pathKey: undefined,
        posInSet: 3,
        setSize: 4,
      }),
    ).toStrictEqual({
      'aria-expanded': undefined,
      'aria-level': 2,
      'aria-posinset': 3,
      'aria-setsize': 4,
    });
  });

  it('announces expansion only where there is something to expand', () => {
    expect(
      resolveTreeRowAriaProps({
        hasChildren: true,
        isExpanded: false,
        level: 1,
        levelDisclosures: [],
        pathKey: 'grp:[["city","Paris"]]',
        posInSet: 1,
        setSize: 2,
      })['aria-expanded'],
    ).toBe(false);
  });
});
