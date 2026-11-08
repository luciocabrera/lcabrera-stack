import { describe, expect, it } from 'vite-plus/test';

import type { ColumnSizingState } from '../Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import { sumColumnWidths } from './sumColumnWidths.util';

type Row = Record<string, unknown>;

describe('sumColumnWidths', () => {
  it('adds each column’s stored size, else its start width', () => {
    expect(
      sumColumnWidths<Row>({
        columns: [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B', width: 120 },
          { key: 'c', label: 'C', width: 120 },
        ],
        columnSizing: { c: 200 } as ColumnSizingState<Row>,
      }),
    ).toBe(DEFAULT_MIN_COLUMN_WIDTH + 120 + 200);
  });

  it('is zero for no columns', () => {
    expect(
      sumColumnWidths<Row>({
        columns: [],
        columnSizing: {} as ColumnSizingState<Row>,
      }),
    ).toBe(0);
  });
});
