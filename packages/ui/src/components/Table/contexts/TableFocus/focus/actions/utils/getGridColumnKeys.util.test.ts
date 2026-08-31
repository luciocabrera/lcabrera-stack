import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { getGridColumnKeys } from './getGridColumnKeys.util';

type Row = Record<string, unknown>;

const column = (key: string): TableColumn<Row> => ({ key, label: key });

describe('getGridColumnKeys', () => {
  it('reads the columns in painted order: left pinned, centre, right pinned', () => {
    expect(
      getGridColumnKeys<Row>({
        centerCols: [column('city'), column('status')],
        leftPinnedCols: [column('id')],
        rightPinnedCols: [column('actions')],
      }),
    ).toEqual(['id', 'city', 'status', 'actions']);
  });

  it('answers an empty list when the grid has no visible columns', () => {
    expect(
      getGridColumnKeys<Row>({
        centerCols: [],
        leftPinnedCols: [],
        rightPinnedCols: [],
      }),
    ).toEqual([]);
  });

  it('omits a hidden column, because the partition it reads already has', () => {
    expect(
      getGridColumnKeys<Row>({
        centerCols: [column('city')],
        leftPinnedCols: [],
        rightPinnedCols: [],
      }),
    ).toEqual(['city']);
  });
});
