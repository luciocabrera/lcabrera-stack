import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumn } from '../Table.types';

import {
  DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH,
  DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH,
} from '../Table.constants';
import { withGroupedColumnWidths } from './withGroupedColumnWidths.util';

type Row = {
  readonly amount: number;
  readonly region: string;
};

const columns: readonly TableColumn<Row>[] = [
  { key: 'region', label: 'Region', maxWidth: 180, minWidth: 130 },
  {
    dataType: 'number',
    key: 'amount',
    label: 'Amount',
    maxWidth: 180,
    minWidth: 130,
  },
];

type RunArgs = {
  readonly columns?: readonly TableColumn<Row>[];
  readonly groupingKeys?: readonly string[];
};

const run = ({
  columns: given = columns,
  groupingKeys = ['region'],
}: RunArgs = {}) =>
  withGroupedColumnWidths<Row>({ columns: given, groupingKeys });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('withGroupedColumnWidths', () => {
  it('gives every grouped column the band, not the widths its source declared', () => {
    expect(
      run().map((column) => [column.minWidth, column.maxWidth]),
    ).toStrictEqual([
      [DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH, DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH],
      [DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH, DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH],
    ]);
  });

  it('leaves the band wide enough to drag, which the source widths were not', () => {
    const [region] = run();

    expect(region?.maxWidth).toBeGreaterThan(region?.minWidth ?? 0);
  });

  it('takes the band the consuming build declares', () => {
    vi.stubEnv('VITE_TABLE_AGGREGATE_MIN_WIDTH', '120');
    vi.stubEnv('VITE_TABLE_AGGREGATE_MAX_WIDTH', '900');

    expect(
      run().map((column) => [column.minWidth, column.maxWidth]),
    ).toStrictEqual([
      [120, 900],
      [120, 900],
    ]);
  });

  it('falls back to the defaults when the declared band is not a width', () => {
    vi.stubEnv('VITE_TABLE_AGGREGATE_MIN_WIDTH', 'wide');
    vi.stubEnv('VITE_TABLE_AGGREGATE_MAX_WIDTH', '-4');

    expect(
      run().map((column) => [column.minWidth, column.maxWidth]),
    ).toStrictEqual([
      [DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH, DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH],
      [DEFAULT_MIN_AGGREGATE_COLUMN_WIDTH, DEFAULT_MAX_AGGREGATE_COLUMN_WIDTH],
    ]);
  });

  it('lets the floor win when the declared band is inverted', () => {
    vi.stubEnv('VITE_TABLE_AGGREGATE_MIN_WIDTH', '400');
    vi.stubEnv('VITE_TABLE_AGGREGATE_MAX_WIDTH', '100');

    expect(run()[0]?.maxWidth).toBe(400);
  });

  it('changes nothing while no grouping is applied', () => {
    expect(run({ groupingKeys: [] })).toBe(columns);
  });

  it('changes nothing when every applied key is undeclared', () => {
    expect(run({ groupingKeys: ['country'] })).toBe(columns);
  });
});
