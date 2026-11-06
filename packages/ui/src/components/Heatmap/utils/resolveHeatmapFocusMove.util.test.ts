import { describe, expect, it } from 'vite-plus/test';

import type { HeatmapLinkedCell } from '#ui/components/Heatmap/Heatmap.types';

import { resolveHeatmapFocusMove } from './resolveHeatmapFocusMove.util';

const at = ([rowIndex, columnIndex]: readonly [
  number,
  number,
]): HeatmapLinkedCell => ({
  columnIndex,
  fill: { kind: 'empty' },
  key: `${String(rowIndex)}/${String(columnIndex)}`,
  label: '',
  pattern: undefined,
  rowIndex,
  to: '/',
  x: 0,
  y: 0,
});

const move = ({
  current,
  isRangeModifier = false,
  key,
  linked,
}: {
  readonly current: HeatmapLinkedCell;
  readonly isRangeModifier?: boolean;
  readonly key: string;
  readonly linked: readonly HeatmapLinkedCell[];
}) =>
  resolveHeatmapFocusMove({
    columnCount: 5,
    current,
    isRangeModifier,
    key,
    linked,
    rowCount: 30,
  })?.key;

const FULL = [0, 1, 2].flatMap((row) =>
  [0, 1, 2].map((column) => at([row, column])),
);
const CENTRE = at([1, 1]);

describe('resolveHeatmapFocusMove', () => {
  it('answers nothing for a key outside the model', () => {
    expect(move({ current: CENTRE, key: 'a', linked: FULL })).toBeUndefined();
  });

  it('answers nothing when there is no linked cell', () => {
    expect(
      move({ current: CENTRE, key: 'ArrowDown', linked: [] }),
    ).toBeUndefined();
    expect(
      move({ current: CENTRE, key: 'ArrowRight', linked: [] }),
    ).toBeUndefined();
  });

  it.each([
    { expected: '1/2', key: 'ArrowRight' },
    { expected: '1/0', key: 'ArrowLeft' },
    { expected: '0/1', key: 'ArrowUp' },
    { expected: '2/1', key: 'ArrowDown' },
    { expected: '1/0', key: 'Home' },
    { expected: '1/2', key: 'End' },
    { expected: '2/1', key: 'PageDown' },
    { expected: '0/1', key: 'PageUp' },
  ])('$key moves to $expected in a full grid', ({ expected, key }) => {
    expect(move({ current: CENTRE, key, linked: FULL })).toBe(expected);
  });

  it.each([
    { expected: '0/0', key: 'Home' },
    { expected: '2/2', key: 'End' },
  ])('modified $key moves to the corner $expected', ({ expected, key }) => {
    expect(
      move({ current: CENTRE, isRangeModifier: true, key, linked: FULL }),
    ).toBe(expected);
  });

  it('modified Home stays in the row when it is the first linked row', () => {
    expect(
      move({
        current: at([0, 2]),
        isRangeModifier: true,
        key: 'Home',
        linked: FULL,
      }),
    ).toBe('0/0');
  });

  it.each([
    { current: at([0, 0]), key: 'ArrowUp' },
    { current: at([0, 0]), key: 'ArrowLeft' },
    { current: at([2, 2]), key: 'ArrowDown' },
    { current: at([2, 2]), key: 'ArrowRight' },
  ])('$key stays on an edge cell', ({ current, key }) => {
    expect(move({ current, key, linked: FULL })).toBe(current.key);
  });

  it('skips the unlinked cells along a row', () => {
    const linked = [at([0, 0]), at([0, 3]), at([0, 4])];

    expect(move({ current: at([0, 0]), key: 'ArrowRight', linked })).toBe(
      '0/3',
    );
    expect(move({ current: at([0, 3]), key: 'ArrowLeft', linked })).toBe('0/0');
    expect(move({ current: at([0, 3]), key: 'Home', linked })).toBe('0/0');
    expect(move({ current: at([0, 0]), key: 'End', linked })).toBe('0/4');
  });

  it('skips the rows with no link, landing on the closest column', () => {
    const linked = [at([0, 2]), at([3, 0]), at([3, 3]), at([6, 1])];

    expect(move({ current: at([0, 2]), key: 'ArrowDown', linked })).toBe('3/3');
    expect(move({ current: at([6, 1]), key: 'ArrowUp', linked })).toBe('3/0');
  });

  it('takes the left one of two equally close columns', () => {
    const linked = [at([0, 2]), at([1, 1]), at([1, 3])];

    expect(move({ current: at([0, 2]), key: 'ArrowDown', linked })).toBe('1/1');
  });

  it('reaches a cell that shares no line with any other', () => {
    const linked = [at([0, 0]), at([0, 2]), at([1, 1]), at([2, 0]), at([2, 2])];

    expect(move({ current: at([0, 0]), key: 'ArrowDown', linked })).toBe('1/1');
  });

  it('moves a page of rows at a time, stopping on the last linked row', () => {
    const linked = [at([0, 0]), at([12, 0]), at([25, 0])];

    expect(move({ current: at([0, 0]), key: 'PageDown', linked })).toBe('12/0');
    expect(move({ current: at([12, 0]), key: 'PageDown', linked })).toBe(
      '25/0',
    );
    expect(move({ current: at([25, 0]), key: 'PageDown', linked })).toBe(
      '25/0',
    );
    expect(move({ current: at([25, 0]), key: 'PageUp', linked })).toBe('12/0');
    expect(move({ current: at([12, 0]), key: 'PageUp', linked })).toBe('0/0');
  });

  it('modified End and Home reach the outermost linked cell when the corner has none', () => {
    const linked = [at([2, 1]), at([2, 2]), at([5, 0]), at([5, 3])];

    expect(
      move({
        current: at([5, 0]),
        isRangeModifier: true,
        key: 'Home',
        linked,
      }),
    ).toBe('2/1');
    expect(
      move({
        current: at([2, 1]),
        isRangeModifier: true,
        key: 'End',
        linked,
      }),
    ).toBe('5/3');
  });
});
