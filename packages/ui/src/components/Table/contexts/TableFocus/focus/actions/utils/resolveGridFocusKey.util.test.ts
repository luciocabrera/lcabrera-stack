import { describe, expect, it } from 'vite-plus/test';

import { resolveGridFocusKey } from './resolveGridFocusKey.util';

const at = (overrides: Partial<Parameters<typeof resolveGridFocusKey>[0]>) =>
  resolveGridFocusKey({
    columnIndex: 2,
    isRangeModifier: false,
    key: 'ArrowDown',
    lastColumnIndex: 4,
    lastRowIndex: 99,
    pageRows: 10,
    rowIndex: 5,
    ...overrides,
  });

describe('resolveGridFocusKey', () => {
  it('moves one row per vertical arrow', () => {
    expect(at({ key: 'ArrowDown' })).toEqual({ columnIndex: 2, rowIndex: 6 });
    expect(at({ key: 'ArrowUp' })).toEqual({ columnIndex: 2, rowIndex: 4 });
  });

  it('moves one column per horizontal arrow', () => {
    expect(at({ key: 'ArrowRight' })).toEqual({ columnIndex: 3, rowIndex: 5 });
    expect(at({ key: 'ArrowLeft' })).toEqual({ columnIndex: 1, rowIndex: 5 });
  });

  it('moves within the row on Home and End', () => {
    expect(at({ key: 'Home' })).toEqual({ columnIndex: 0, rowIndex: 5 });
    expect(at({ key: 'End' })).toEqual({ columnIndex: 4, rowIndex: 5 });
  });

  it('moves to the corners of the grid with the range modifier', () => {
    expect(at({ isRangeModifier: true, key: 'Home' })).toEqual({
      columnIndex: 0,
      rowIndex: 0,
    });
    expect(at({ isRangeModifier: true, key: 'End' })).toEqual({
      columnIndex: 4,
      rowIndex: 99,
    });
  });

  it('moves a page of rows on PageDown and PageUp, keeping the column', () => {
    expect(at({ key: 'PageDown' })).toEqual({ columnIndex: 2, rowIndex: 15 });
    expect(at({ key: 'PageUp' })).toEqual({ columnIndex: 2, rowIndex: -5 });
  });

  it('answers undefined for a key the grid does not claim', () => {
    expect(at({ key: 'a' })).toBeUndefined();
    expect(at({ key: 'Enter' })).toBeUndefined();
    expect(at({ key: 'Tab' })).toBeUndefined();
    expect(at({ key: ' ' })).toBeUndefined();
  });

  it('answers off the edge rather than clamping, leaving bounds to the caller', () => {
    // The two halves are split on purpose: this one knows what a key means, the
    // caller knows how big the grid is. Clamping here would make "the key did
    // nothing" and "the key is not ours" the same answer.
    expect(at({ key: 'ArrowUp', rowIndex: 0 })).toEqual({
      columnIndex: 2,
      rowIndex: -1,
    });
    expect(at({ columnIndex: 4, key: 'ArrowRight' })).toEqual({
      columnIndex: 5,
      rowIndex: 5,
    });
  });
});
