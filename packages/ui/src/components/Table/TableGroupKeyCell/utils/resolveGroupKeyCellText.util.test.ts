import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import { resolveGroupKeyCellText } from './resolveGroupKeyCellText.util';

const GROUPING_KEYS = ['city', 'district'];

type SummaryArgs = {
  readonly isSubtotal?: boolean;
  readonly path: readonly (readonly [string, string])[];
};

const summaryOf = ({
  isSubtotal = false,
  path,
}: SummaryArgs): TableGroupRowSummary => ({
  aggregates: [],
  count: 1,
  isSubtotal,
  path: path.map(([columnKey, label]) => ({ columnKey, label, value: label })),
});

type ResolveArgs = {
  readonly columnKey: string;
  readonly summary: TableGroupRowSummary;
};

const resolve = ({ columnKey, summary }: ResolveArgs) =>
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
    expect(
      resolve({ columnKey: 'city', summary: summaryOf({ path: FULL_PATH }) }),
    ).toStrictEqual({
      isInnermost: false,
      text: 'Paris',
    });
  });

  it('marks the last path entry as the innermost level', () => {
    expect(
      resolve({
        columnKey: 'district',
        summary: summaryOf({ path: FULL_PATH }),
      }),
    ).toStrictEqual({
      isInnermost: true,
      text: 'Marais',
    });
  });

  it('leaves a level the row does not carry empty', () => {
    expect(
      resolve({
        columnKey: 'district',
        summary: summaryOf({ path: [['city', 'Paris']] }),
      }),
    ).toBeUndefined();
  });

  it('suffixes a subtotal at the level it totals', () => {
    expect(
      resolve({
        columnKey: 'city',
        summary: summaryOf({ isSubtotal: true, path: [['city', 'Paris']] }),
      }),
    ).toStrictEqual({ isInnermost: true, text: 'Paris total' });
  });

  it('does not suffix a subtotal’s ancestors', () => {
    expect(
      resolve({
        columnKey: 'city',
        summary: summaryOf({ isSubtotal: true, path: FULL_PATH }),
      }),
    ).toStrictEqual({
      isInnermost: false,
      text: 'Paris',
    });
  });

  it('places the grand total on the first key column', () => {
    expect(
      resolve({
        columnKey: 'city',
        summary: summaryOf({ isSubtotal: true, path: [] }),
      }),
    ).toStrictEqual({
      isInnermost: true,
      text: 'Grand total',
    });
  });

  it('leaves every other key column empty for the grand total', () => {
    expect(
      resolve({
        columnKey: 'district',
        summary: summaryOf({ isSubtotal: true, path: [] }),
      }),
    ).toBeUndefined();
  });

  it('reads a cube row’s arbitrary subset by column, not by position', () => {
    const cubeRow = summaryOf({ path: [['district', 'Marais']] });

    expect(resolve({ columnKey: 'city', summary: cubeRow })).toBeUndefined();
    expect(resolve({ columnKey: 'district', summary: cubeRow })).toStrictEqual({
      isInnermost: true,
      text: 'Marais',
    });
  });
});
