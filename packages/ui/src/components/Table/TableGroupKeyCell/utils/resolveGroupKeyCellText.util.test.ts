import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { resolveGroupKeyCellText } from './resolveGroupKeyCellText.util';

const GROUPING_KEYS = ['city', 'district'];

const summaryOf = (
  path: readonly (readonly [string, string])[],
  isSubtotal = false,
): TableGroupRowSummary => ({
  aggregates: [],
  count: 1,
  isSubtotal,
  path: path.map(([columnKey, label]) => ({ columnKey, label, value: label })),
});

const resolve = (columnKey: string, summary: TableGroupRowSummary) =>
  resolveGroupKeyCellText({
    columnKey,
    groupingKeys: GROUPING_KEYS,
    summary,
  });

const FULL_PATH = [
  ['city', 'Paris'],
  ['district', 'Marais'],
] as const;

describe('resolveGroupKeyCellText', () => {
  it("renders a level's label in that level's own column", () => {
    expect(resolve('city', summaryOf(FULL_PATH))).toStrictEqual({
      isInnermost: false,
      text: 'Paris',
    });
  });

  it('marks the last path entry as the innermost level', () => {
    expect(resolve('district', summaryOf(FULL_PATH))).toStrictEqual({
      isInnermost: true,
      text: 'Marais',
    });
  });

  it('leaves a level the row does not carry empty', () => {
    // A rollup subtotal carries one entry fewer than the rows it totals, so
    // most grouped results leave some key columns empty on some rows. Which
    // columns are filled is the depth signal (ADR-080).
    expect(resolve('district', summaryOf([['city', 'Paris']]))).toBeUndefined();
  });

  it('suffixes a subtotal at the level it totals', () => {
    expect(resolve('city', summaryOf([['city', 'Paris']], true))).toStrictEqual(
      { isInnermost: true, text: 'Paris total' },
    );
  });

  it('does not suffix a subtotal’s ancestors', () => {
    // The ancestry reads exactly as a leaf group's does; the one column where a
    // subtotal differs is the level it totals.
    expect(resolve('city', summaryOf(FULL_PATH, true))).toStrictEqual({
      isInnermost: false,
      text: 'Paris',
    });
  });

  it('places the grand total on the first key column', () => {
    expect(resolve('city', summaryOf([], true))).toStrictEqual({
      isInnermost: true,
      text: 'Grand total',
    });
  });

  it('leaves every other key column empty for the grand total', () => {
    expect(resolve('district', summaryOf([], true))).toBeUndefined();
  });

  it('reads a cube row’s arbitrary subset by column, not by position', () => {
    // Cube emits every subset, so a row may carry the second key and not the
    // first. `path.at(-1)` is still its innermost; `path.length - 1` is not a
    // depth and is never consulted.
    const cubeRow = summaryOf([['district', 'Marais']]);

    expect(resolve('city', cubeRow)).toBeUndefined();
    expect(resolve('district', cubeRow)).toStrictEqual({
      isInnermost: true,
      text: 'Marais',
    });
  });
});
