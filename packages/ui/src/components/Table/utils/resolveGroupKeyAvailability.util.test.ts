import { describe, expect, it } from 'vite-plus/test';

import type {
  TableColumn,
  TableColumnGroupingCapability,
} from '#ui/components/Table/Table.types';

import { resolveGroupKeyAvailability } from './resolveGroupKeyAvailability.util';

type Row = { readonly total_amount: string };

const column: TableColumn<Row> = { key: 'total_amount', label: 'Total Amount' };

const refused: TableColumnGroupingCapability = {
  aggregates: ['avg', 'count', 'sum'],
  canGroup: false,
  column: 'total_amount',
  distinctEstimate: 77_567,
  periods: [],
  refusal: 'too-many-distinct',
  role: 'fact',
  typeName: 'numeric',
};

const allowed: TableColumnGroupingCapability = {
  aggregates: ['count'],
  canGroup: true,
  column: 'total_amount',
  distinctEstimate: 8,
  periods: [],
  role: 'dimension',
  typeName: 'text',
};

describe('resolveGroupKeyAvailability', () => {
  it('refuses a column the catalogue refused, however the column is declared', () => {
    expect(
      resolveGroupKeyAvailability<Row>({ capability: refused, column }),
    ).toEqual({ isGroupable: false, refusal: 'too-many-distinct' });
  });

  it('leaves the declared answer standing when the route resolved no capability', () => {
    expect(
      resolveGroupKeyAvailability<Row>({ capability: undefined, column }),
    ).toEqual({ isGroupable: true, refusal: undefined });
  });

  it('keeps a consumer opt-out even when the catalogue would allow the column', () => {
    expect(
      resolveGroupKeyAvailability<Row>({
        capability: allowed,
        column: { ...column, isGroupable: false },
      }),
    ).toEqual({ isGroupable: false, refusal: undefined });
  });

  it('reports no reason for a consumer opt-out the catalogue also refuses', () => {
    expect(
      resolveGroupKeyAvailability<Row>({
        capability: refused,
        column: { ...column, isGroupable: false },
      }),
    ).toEqual({ isGroupable: false, refusal: undefined });
  });

  it('allows a column both gates accept', () => {
    expect(
      resolveGroupKeyAvailability<Row>({ capability: allowed, column }),
    ).toEqual({ isGroupable: true, refusal: undefined });
  });

  it('treats an unknown column as the defaults do rather than throwing', () => {
    expect(
      resolveGroupKeyAvailability<Row>({
        capability: undefined,
        column: undefined,
      }),
    ).toEqual({ isGroupable: true, refusal: undefined });
  });
});

describe('a column the catalogue refuses raw but offers truncated', () => {
  const orderDate = {
    aggregates: ['count'],
    canGroup: false,
    column: 'order_date',
    distinctEstimate: 1800,
    periods: ['month', 'quarter', 'year'],
    refusal: 'too-many-distinct',
    role: 'dimension',
    typeName: 'date',
  } as const satisfies TableColumnGroupingCapability;

  it('is offerable, and names the granularity it must be added with', () => {
    expect(
      resolveGroupKeyAvailability({
        capability: orderDate,
        column: { key: 'order_date', label: 'Order Date' },
      }),
    ).toStrictEqual({
      isGroupable: true,
      refusal: undefined,
      requiredPeriod: 'month',
    });
  });

  it('offers the finest granularity, which is the one a reader can coarsen from', () => {
    expect(
      resolveGroupKeyAvailability({
        capability: { ...orderDate, periods: ['year'] },
        column: { key: 'order_date', label: 'Order Date' },
      }).requiredPeriod,
    ).toBe('year');
  });

  it('stays refused when there is no granularity either', () => {
    expect(
      resolveGroupKeyAvailability({
        capability: { ...orderDate, periods: [] },
        column: { key: 'order_date', label: 'Order Date' },
      }),
    ).toStrictEqual({
      isGroupable: false,
      refusal: 'too-many-distinct',
      requiredPeriod: undefined,
    });
  });

  it('requires no granularity for a column the catalogue accepts raw', () => {
    expect(
      resolveGroupKeyAvailability({
        capability: { ...orderDate, canGroup: true, refusal: undefined },
        column: { key: 'order_date', label: 'Order Date' },
      }).requiredPeriod,
    ).toBeUndefined();
  });

  it('still refuses a column the table itself declared ungroupable', () => {
    expect(
      resolveGroupKeyAvailability({
        capability: orderDate,
        column: { isGroupable: false, key: 'order_date', label: 'Order Date' },
      }),
    ).toStrictEqual({
      isGroupable: false,
      refusal: undefined,
      requiredPeriod: undefined,
    });
  });
});
