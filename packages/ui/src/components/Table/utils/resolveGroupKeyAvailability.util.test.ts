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
    // The defect this closes: `isGroupable` defaults to true, so a column the
    // endpoint will reject was offered by default (#642).
    expect(
      resolveGroupKeyAvailability<Row>({ capability: refused, column }),
    ).toEqual({ isGroupable: false, refusal: 'too-many-distinct' });
  });

  it('leaves the declared answer standing when the route resolved no capability', () => {
    // Absence is "nobody asked", not "refused" — a route may group without
    // shipping a capability map at all.
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
    // Both facts are true at once, and they are different facts. Forwarding the
    // catalogue's reason here would attribute the table's own decision to the
    // endpoint, and hand the user a sentence about distinct values for a column
    // that was never going to be on the menu.
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
    // The defect this exists to prevent: reading `canGroup` alone filtered
    // `order_date` out of the add-key list, so the granularity control could
    // never render and period grouping was unreachable from the UI (ADR-084).
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
    // A refusal that a granularity cannot answer — a unique-ish id column, or a
    // date whose range is too wide for even a year.
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
    // The consumer's opt-out is checked first and a granularity cannot buy past
    // it: the table said no, which is a different fact from the database's.
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
