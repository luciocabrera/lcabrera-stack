import { describe, expect, it } from 'vitest';

import type { ColumnFiltersState } from '@repo/ui/components/Table/Table.types';

import { resolveColumnFilterUpdate } from './resolveColumnFilterUpdate.util';

type Row = {
  readonly priority: string;
  readonly status: string;
};

describe('resolveColumnFilterUpdate', () => {
  it('adds or replaces a single column filter and builds the persistence entry', () => {
    const result = resolveColumnFilterUpdate<Row>({
      columnFiltersState: {
        status: {
          operator: 'equals',
          type: 'text',
          value: 'active',
        },
      } as ColumnFiltersState<Row>,
      columnKey: 'priority',
      filter: {
        operator: 'equals',
        type: 'text',
        value: 'high',
      },
    });

    expect(result.columnFilters).toEqual({
      priority: {
        operator: 'equals',
        type: 'text',
        value: 'high',
      },
      status: {
        operator: 'equals',
        type: 'text',
        value: 'active',
      },
    });
    expect(result.persistenceEntry).toEqual({
      searchParamKey: 'filters',
      searchParamValue: '{"status":["eq","active"],"priority":["eq","high"]}',
    });
  });

  it('removes a filter when null is provided', () => {
    const result = resolveColumnFilterUpdate<Row>({
      columnFiltersState: {
        priority: {
          operator: 'equals',
          type: 'text',
          value: 'high',
        },
        status: {
          operator: 'equals',
          type: 'text',
          value: 'active',
        },
      } as ColumnFiltersState<Row>,
      columnKey: 'status',
      filter: undefined,
    });

    expect(result.columnFilters).toEqual({
      priority: {
        operator: 'equals',
        type: 'text',
        value: 'high',
      },
    });
  });
});
