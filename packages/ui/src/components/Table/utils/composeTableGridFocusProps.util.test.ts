import type { FocusEvent, KeyboardEvent } from 'react';

import { describe, expect, it, vi } from 'vite-plus/test';

import { composeTableGridFocusProps } from './composeTableGridFocusProps.util';

const createGrid = () => ({
  onBlur: vi.fn(),
  onFocus: vi.fn(),
  onKeyDown: vi.fn(),
  tabIndex: 0,
});

const FOCUS_EVENT = {} as FocusEvent<HTMLTableElement>;
const KEY_EVENT = {} as KeyboardEvent<HTMLTableElement>;

describe('composeTableGridFocusProps', () => {
  it('hands back the grid props when the consumer gave no handlers', () => {
    const grid = createGrid();

    expect(composeTableGridFocusProps({ grid, tableProps: {} })).toStrictEqual(
      grid,
    );
  });

  it('runs each consumer handler with the grid handler of the same event only', () => {
    const grid = createGrid();
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const onKeyDown = vi.fn();
    const composed = composeTableGridFocusProps({
      grid,
      tableProps: { onBlur, onFocus, onKeyDown },
    });

    composed.onBlur(FOCUS_EVENT);

    expect(
      [onBlur, grid.onBlur].map((fn) => fn.mock.calls.length),
    ).toStrictEqual([1, 1]);
    expect(onFocus).not.toHaveBeenCalled();

    composed.onFocus(FOCUS_EVENT);

    expect(
      [onFocus, grid.onFocus].map((fn) => fn.mock.calls.length),
    ).toStrictEqual([1, 1]);
    expect(onKeyDown).not.toHaveBeenCalled();

    composed.onKeyDown(KEY_EVENT);

    expect(
      [onKeyDown, grid.onKeyDown].map((fn) => fn.mock.calls.length),
    ).toStrictEqual([1, 1]);
  });

  it('keeps the grid tab stop', () => {
    expect(
      composeTableGridFocusProps({
        grid: { ...createGrid(), tabIndex: -1 },
        tableProps: {},
      }).tabIndex,
    ).toBe(-1);
  });
});
