import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { hasHeaderBands, resolveHeaderBands } from './resolveHeaderBands.util';

type ColumnArgs = {
  readonly group?: string;
  readonly key: string;
  readonly label: string;
};

type Row = {
  readonly customer_type: string;
  readonly total_amount: number;
};

const column = ({ group, key, label }: ColumnArgs) =>
  ({
    key,
    label,
    ...(group !== undefined && { headerGroupLabel: group }),
  }) as TableColumn<Row>;

const shape = <TData>(bands: ReturnType<typeof resolveHeaderBands<TData>>) =>
  bands.map((band) => ({
    keys: band.columns.map((column) => String(column.key)),
    label: band.label,
  }));

describe('resolveHeaderBands', () => {
  it('gives every column a band, labelled only where it has a group', () => {
    const bands = resolveHeaderBands<Row>({
      columns: [
        column({ key: 'customer_type', label: 'Customer Type' }),
        column({
          group: 'Total Amount',
          key: 'total_amount:avg',
          label: 'Average',
        }),
        column({
          group: 'Total Amount',
          key: 'total_amount:min',
          label: 'Minimum',
        }),
      ],
    });

    expect(shape(bands)).toStrictEqual([
      { keys: ['customer_type'], label: undefined },
      {
        keys: ['total_amount:avg', 'total_amount:min'],
        label: 'Total Amount',
      },
    ]);
  });

  it('splits a group whose columns are not adjacent', () => {
    const bands = resolveHeaderBands<Row>({
      columns: [
        column({
          group: 'Total Amount',
          key: 'total_amount:avg',
          label: 'Average',
        }),
        column({ key: 'customer_type', label: 'Customer Type' }),
        column({
          group: 'Total Amount',
          key: 'total_amount:min',
          label: 'Minimum',
        }),
      ],
    });

    expect(shape(bands)).toStrictEqual([
      { keys: ['total_amount:avg'], label: 'Total Amount' },
      { keys: ['customer_type'], label: undefined },
      { keys: ['total_amount:min'], label: 'Total Amount' },
    ]);
  });

  it('keeps two different groups apart even when adjacent', () => {
    const bands = resolveHeaderBands<Row>({
      columns: [
        column({
          group: 'Total Amount',
          key: 'total_amount:sum',
          label: 'Sum',
        }),
        column({ group: 'Quantity', key: 'quantity:sum', label: 'Sum' }),
      ],
    });

    expect(shape(bands)).toStrictEqual([
      { keys: ['total_amount:sum'], label: 'Total Amount' },
      { keys: ['quantity:sum'], label: 'Quantity' },
    ]);
  });

  it('returns nothing for no columns', () => {
    expect(resolveHeaderBands<Row>({ columns: [] })).toStrictEqual([]);
  });
});

describe('hasHeaderBands', () => {
  it('is false for a grid of plain columns, so no band row is drawn', () => {
    expect(
      hasHeaderBands<Row>([
        column({ key: 'customer_type', label: 'Customer Type' }),
        column({ key: 'total_amount', label: 'Total Amount' }),
      ]),
    ).toBe(false);
  });

  it('is true as soon as one column carries a group', () => {
    expect(
      hasHeaderBands<Row>([
        column({ key: 'customer_type', label: 'Customer Type' }),
        column({
          group: 'Total Amount',
          key: 'total_amount:avg',
          label: 'Average',
        }),
      ]),
    ).toBe(true);
  });
});
