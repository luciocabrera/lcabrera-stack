import { describe, expect, it } from 'vite-plus/test';

import { resolveGroupExpansionKey } from './resolveGroupExpansionKey.util';

const groupRow = {
  hasChildren: true,
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
