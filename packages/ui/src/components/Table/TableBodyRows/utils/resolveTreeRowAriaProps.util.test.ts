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
        isDrillable: false,
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
        isDrillable: false,
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

describe('resolveTreeRowAriaProps — a drillable leaf', () => {
  const leaf = {
    hasChildren: false,
    isDrillable: true,
    level: 2,
    levelDisclosures: [],
    pathKey: 'region:Iberia',
    posInSet: 1,
    setSize: 3,
  };

  it('carries aria-expanded even with no loaded children', () => {
    // It can reveal rows, which is what the attribute describes. The two flags
    // are disjoint in a rollup, where the only row owning loaded children is
    // the subtotal that may not drill (ADR-079).
    expect(
      resolveTreeRowAriaProps({ ...leaf, isExpanded: false })['aria-expanded'],
    ).toBe(false);
  });

  it('reports itself open once the group is opened, not once rows land', () => {
    // `isExpanded` is true from the moment a drill is asked for, because the
    // loading row and the failure row are themselves content under the group —
    // a control reporting itself closed while showing a spinner underneath
    // would describe the tree wrongly for as long as the fetch takes.
    expect(
      resolveTreeRowAriaProps({ ...leaf, isExpanded: true })['aria-expanded'],
    ).toBe(true);
  });

  it('withholds it from a leaf that is neither drillable nor a parent', () => {
    expect(
      resolveTreeRowAriaProps({
        ...leaf,
        isDrillable: false,
        isExpanded: false,
      })['aria-expanded'],
    ).toBeUndefined();
  });
});
