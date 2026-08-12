import { describe, expect, it } from 'vite-plus/test';

import { resolveGridFocusMove } from './resolveGridFocusMove.util';

const move = (overrides: Partial<Parameters<typeof resolveGridFocusMove>[0]>) =>
  resolveGridFocusMove({
    columnCount: 3,
    columnIndex: 1,
    hasFocusedCell: true,
    isRangeModifier: false,
    key: 'ArrowDown',
    pageRows: 10,
    rowCount: 50,
    rowIndex: 5,
    ...overrides,
  });

describe('resolveGridFocusMove', () => {
  it('clamps at every edge rather than wrapping around', () => {
    expect(move({ key: 'ArrowUp', rowIndex: 0 })).toEqual({
      columnIndex: 1,
      rowIndex: 0,
    });
    expect(move({ key: 'ArrowDown', rowIndex: 49 })).toEqual({
      columnIndex: 1,
      rowIndex: 49,
    });
    expect(move({ columnIndex: 0, key: 'ArrowLeft' })).toEqual({
      columnIndex: 0,
      rowIndex: 5,
    });
    expect(move({ columnIndex: 2, key: 'ArrowRight' })).toEqual({
      columnIndex: 2,
      rowIndex: 5,
    });
  });

  it('clamps a page move that overshoots the end of the data', () => {
    expect(move({ key: 'PageDown', rowIndex: 45 })).toEqual({
      columnIndex: 1,
      rowIndex: 49,
    });
    expect(move({ key: 'PageUp', rowIndex: 3 })).toEqual({
      columnIndex: 1,
      rowIndex: 0,
    });
  });

  it('focuses the first cell when the grid has not been entered yet', () => {
    // There is no current cell to step from, so any grid key means "start
    // here" rather than "one step from a position that does not exist".
    expect(
      move({ columnIndex: -1, hasFocusedCell: false, key: 'ArrowDown' }),
    ).toEqual({ columnIndex: 0, rowIndex: 0 });
    expect(
      move({ columnIndex: -1, hasFocusedCell: false, key: 'End' }),
    ).toEqual({ columnIndex: 0, rowIndex: 0 });
  });

  it('answers undefined for a key the grid does not claim', () => {
    expect(move({ key: 'Escape' })).toBeUndefined();
    expect(move({ hasFocusedCell: false, key: 'Escape' })).toBeUndefined();
  });

  it('answers undefined when there is nothing to move within', () => {
    expect(move({ rowCount: 0 })).toBeUndefined();
    expect(move({ columnCount: 0 })).toBeUndefined();
  });

  it('treats a page of no rows as a page of one', () => {
    // The container has not been measured yet. Zero would make the key dead.
    expect(move({ key: 'PageDown', pageRows: 0 })).toEqual({
      columnIndex: 1,
      rowIndex: 6,
    });
  });

  it('recovers from a stored position that no longer exists', () => {
    // The data shrank under the focus target; the move still lands inside the
    // grid rather than off the end of it.
    expect(move({ key: 'ArrowDown', rowCount: 4, rowIndex: 80 })).toEqual({
      columnIndex: 1,
      rowIndex: 3,
    });
  });
});
