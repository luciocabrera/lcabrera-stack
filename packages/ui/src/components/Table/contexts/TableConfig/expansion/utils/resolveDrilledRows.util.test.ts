import { describe, expect, it } from 'vite-plus/test';

import type {
  TableGroupDrill,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TABLE_DRILL_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { resolveDrilledRows } from './resolveDrilledRows.util';

const PATH_KEY = 'city:Paris';

const summaryOf = (count: number): TableGroupRowSummary => ({
  aggregates: [],
  count,
  isSubtotal: false,
  path: [{ columnKey: 'city', label: 'Paris', value: 'Paris' }],
});

type ResolveArgs = {
  readonly count?: number;
  readonly drill: TableGroupDrill | undefined;
  readonly isCollapsed?: boolean;
};

const resolve = ({ count = 3, drill, isCollapsed = false }: ResolveArgs) =>
  resolveDrilledRows({
    drill,
    isCollapsed,
    pathKey: PATH_KEY,
    summary: summaryOf(count),
  });

const markerOf = (row: Record<string, unknown> | undefined) =>
  row?.[TABLE_DRILL_ROW_FIELD];

const PAGE = [{ id: 1 }, { id: 2 }];

describe('resolveDrilledRows', () => {
  it('contributes nothing when nobody has asked', () => {
    // A drill is opt-in, and the collapsed set cannot express that: an untouched
    // group is *expanded*, so reading a drill off expansion would fetch every
    // group the moment the grid rendered (ADR-067, ADR-079).
    expect(resolve({ drill: undefined })).toStrictEqual([]);
  });

  it('contributes one loading row while the page is in flight', () => {
    const rows = resolve({ drill: { rows: [], status: 'loading' } });

    expect(rows).toHaveLength(1);
    expect(markerOf(rows[0])).toMatchObject({
      kind: 'loading',
      pathKey: PATH_KEY,
    });
  });

  it('contributes one failure row, which is not an empty page', () => {
    const rows = resolve({ drill: { rows: [], status: 'failed' } });

    expect(rows).toHaveLength(1);
    expect(markerOf(rows[0])).toMatchObject({ kind: 'failed' });
  });

  it('contributes the page alone when it holds the whole group', () => {
    expect(
      resolve({ count: 2, drill: { rows: PAGE, status: 'loaded' } }),
    ).toStrictEqual(PAGE);
  });

  it('adds a hand-off stating the shortfall when the group holds more', () => {
    const rows = resolve({ count: 9, drill: { rows: PAGE, status: 'loaded' } });

    expect(rows).toHaveLength(3);
    expect(markerOf(rows[2])).toMatchObject({ kind: 'handoff', shortfall: 7 });
  });

  it('measures the shortfall against the group count, not the rows', () => {
    // The group is the one that knows how many rows it has; the rows only know
    // how many arrived, which is the other question.
    const rows = resolve({
      count: 100,
      drill: { rows: PAGE, status: 'loaded' },
    });

    expect(markerOf(rows.at(-1))).toMatchObject({ shortfall: 98 });
  });

  it('adds no hand-off when the count and the page agree', () => {
    const rows = resolve({ count: 2, drill: { rows: PAGE, status: 'loaded' } });

    expect(rows.some((row) => markerOf(row) !== undefined)).toBe(false);
  });

  it('hides a drilled page while its group is collapsed, keeping the entry', () => {
    // Collapsing must not discard the page: re-expanding would then re-fetch,
    // and `loaded` is terminal (ADR-079).
    expect(
      resolve({
        drill: { rows: PAGE, status: 'loaded' },
        isCollapsed: true,
      }),
    ).toStrictEqual([]);
  });

  it('carries the group path so a hand-off can rebuild the drill filters', () => {
    const rows = resolve({ count: 9, drill: { rows: PAGE, status: 'loaded' } });

    expect(markerOf(rows.at(-1))).toMatchObject({
      path: [{ columnKey: 'city', label: 'Paris', value: 'Paris' }],
    });
  });
});
