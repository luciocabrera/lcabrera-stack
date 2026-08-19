import { describe, expect, it } from 'vite-plus/test';

import { resolveGroupExpansionKey } from './resolveGroupExpansionKey.util';

const groupRow = {
  hasChildren: true,
  isDrillable: false,
  isGroupRow: true,
};

describe('resolveGroupExpansionKey', () => {
  it('expands a collapsed group on Right and collapses an open one on Left', () => {
    expect(
      resolveGroupExpansionKey({
        ...groupRow,
        isExpanded: false,
        key: 'ArrowRight',
      }),
    ).toBe('expand');
    expect(
      resolveGroupExpansionKey({
        ...groupRow,
        isExpanded: true,
        key: 'ArrowLeft',
      }),
    ).toBe('collapse');
  });

  it('hands the key back once the row is already in that state', () => {
    // The fallback is what keeps horizontal navigation reachable: Right on an
    // open group moves between cells, and pressing it twice on a closed one
    // opens it and then moves.
    expect(
      resolveGroupExpansionKey({
        ...groupRow,
        isExpanded: true,
        key: 'ArrowRight',
      }),
    ).toBeUndefined();
    expect(
      resolveGroupExpansionKey({
        ...groupRow,
        isExpanded: false,
        key: 'ArrowLeft',
      }),
    ).toBeUndefined();
  });

  it('leaves a detail row’s horizontal keys alone', () => {
    expect(
      resolveGroupExpansionKey({
        hasChildren: false,
        isDrillable: false,
        isExpanded: false,
        isGroupRow: false,
        key: 'ArrowRight',
      }),
    ).toBeUndefined();
  });

  it('leaves a childless group row alone rather than toggling an invisible state', () => {
    expect(
      resolveGroupExpansionKey({
        hasChildren: false,
        isDrillable: false,
        isExpanded: true,
        isGroupRow: true,
        key: 'ArrowLeft',
      }),
    ).toBeUndefined();
  });

  it('claims no key but the two horizontal ones', () => {
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' ']) {
      expect(
        resolveGroupExpansionKey({ ...groupRow, isExpanded: false, key }),
      ).toBeUndefined();
    }
  });
});

describe('resolveGroupExpansionKey — a drillable leaf', () => {
  // It owns no loaded children, so `hasChildren` is false; pressing Right on it
  // fetches its rows, which is the same gesture the chevron performs. The two
  // flags are disjoint in a rollup, so neither substitutes for the other
  // (ADR-079).
  const drillableLeaf = {
    hasChildren: false,
    isDrillable: true,
    isGroupRow: true,
  };

  it('expands on Right even with no loaded children', () => {
    expect(
      resolveGroupExpansionKey({
        ...drillableLeaf,
        isExpanded: false,
        key: 'ArrowRight',
      }),
    ).toBe('expand');
  });

  it('collapses an open drill on Left', () => {
    expect(
      resolveGroupExpansionKey({
        ...drillableLeaf,
        isExpanded: true,
        key: 'ArrowLeft',
      }),
    ).toBe('collapse');
  });

  it('leaves a leaf that is neither alone', () => {
    expect(
      resolveGroupExpansionKey({
        hasChildren: false,
        isDrillable: false,
        isExpanded: false,
        isGroupRow: true,
        key: 'ArrowRight',
      }),
    ).toBeUndefined();
  });
});
