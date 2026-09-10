import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import { arePaintedColumnsUnchanged } from './arePaintedColumnsUnchanged.util';

type Row = {
  readonly status: string;
  readonly sum_c0: number;
};

const column = (
  patch: Partial<Pick<TableColumn<Row>, 'headerGroupLabel'>> &
    Pick<TableColumn<Row>, 'key' | 'label'>,
) => patch;

describe('arePaintedColumnsUnchanged', () => {
  it('treats the same keys and labels as unchanged', () => {
    expect(
      arePaintedColumnsUnchanged({
        current: [column({ key: 'sum_c0', label: 'Pending' })],
        next: [column({ key: 'sum_c0', label: 'Pending' })],
      }),
    ).toBe(true);
  });

  it('treats the same aliases under different axis values as a change', () => {
    expect(
      arePaintedColumnsUnchanged({
        current: [column({ key: 'sum_c0', label: 'Pending' })],
        next: [column({ key: 'sum_c0', label: 'Shipped' })],
      }),
    ).toBe(false);
  });

  it('treats a spanning header relabel as a change', () => {
    expect(
      arePaintedColumnsUnchanged({
        current: [
          column({
            headerGroupLabel: 'Pending',
            key: 'sum_c0',
            label: 'Sum',
          }),
        ],
        next: [
          column({
            headerGroupLabel: 'Shipped',
            key: 'sum_c0',
            label: 'Sum',
          }),
        ],
      }),
    ).toBe(false);
  });
});
