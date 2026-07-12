import type { TableColumn } from '@repo/ui/components/Table';

import { describe, expect, it } from 'vitest';

import type { EnterpriseOrder } from '@/services';

import { buildEnterpriseOrdersQuery } from './buildEnterpriseOrdersQuery.util';

const columns = [
  { dataType: 'number', isPrimaryKey: true, key: 'id', label: 'ID' },
  { dataType: 'string', key: 'customer_name', label: 'Customer' },
] as unknown as readonly TableColumn<EnterpriseOrder>[];

describe('buildEnterpriseOrdersQuery', () => {
  const emptyFilter = {} as Parameters<
    typeof buildEnterpriseOrdersQuery
  >[0]['columnsState']['columnFilters'];

  it('appends the primary-key tiebreaker to the sanitized sorting', () => {
    const result = buildEnterpriseOrdersQuery({
      columnsState: {
        columnFilters: emptyFilter,
        columns,
        sorting: [{ columnKey: 'customer_name', direction: 'desc' }],
      },
      limit: 25,
      skip: 25,
    });

    expect(result.sorting).toEqual([
      { columnKey: 'customer_name', direction: 'desc' },
      { columnKey: 'id', direction: 'asc' },
    ]);
  });

  it('passes active filters through untouched', () => {
    const filter = {
      status: { operator: 'equals', type: 'text', value: 'open' },
    } as unknown as NonNullable<
      Parameters<
        typeof buildEnterpriseOrdersQuery
      >[0]['columnsState']['columnFilters']
    >;

    const result = buildEnterpriseOrdersQuery({
      columnsState: { columnFilters: filter, columns },
      limit: 10,
      skip: 0,
    });

    expect(result.filter).toBe(filter);
  });
});
