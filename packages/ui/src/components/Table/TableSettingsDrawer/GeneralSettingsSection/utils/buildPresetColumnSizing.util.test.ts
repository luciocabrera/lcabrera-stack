import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { buildPresetColumnSizing } from './buildPresetColumnSizing.util';

type Row = {
  readonly amount: number;
  readonly id: string;
  readonly name: string;
};

const columns = [
  { key: 'id', label: 'Id', maxWidth: 120, minWidth: 60 },
  { key: 'name', label: 'Name', minWidth: 100 },
  { key: 'amount', label: 'Amount', maxWidth: 200 },
] as unknown as readonly TableColumn<Row>[];

describe('buildPresetColumnSizing', () => {
  it('returns an empty sizing state for the default preset', () => {
    expect(buildPresetColumnSizing({ columns, preset: 'default' })).toEqual({});
  });

  it('sizes only columns with a configured max width for the max preset', () => {
    expect(buildPresetColumnSizing({ columns, preset: 'max' })).toEqual({
      amount: 200,
      id: 120,
    });
  });

  it('sizes only columns with a configured min width for the min preset', () => {
    expect(buildPresetColumnSizing({ columns, preset: 'min' })).toEqual({
      id: 60,
      name: 100,
    });
  });

  it('returns an empty sizing state when no column configures the bound', () => {
    const unbounded = [
      { key: 'id', label: 'Id' },
    ] as unknown as readonly TableColumn<Row>[];

    expect(
      buildPresetColumnSizing({ columns: unbounded, preset: 'max' }),
    ).toEqual({});
  });
});
