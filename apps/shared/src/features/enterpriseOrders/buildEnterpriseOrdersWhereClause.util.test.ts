import { describe, expect, it } from 'vite-plus/test';

import { buildEnterpriseOrdersWhereClause } from './buildEnterpriseOrdersWhereClause.util.js';

describe('buildEnterpriseOrdersWhereClause', () => {
  it('returns an empty clause when there are no filters', () => {
    expect(buildEnterpriseOrdersWhereClause({})).toEqual({
      queryParams: [],
      whereClause: '',
    });
  });

  it('builds a combined WHERE clause with stable parameter ordering', () => {
    const result = buildEnterpriseOrdersWhereClause({
      created_at: {
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-01-31',
      },
      is_priority: {
        type: 'boolean',
        value: true,
      },
      status: {
        operator: 'notEquals',
        type: 'multiSelect',
        values: ['cancelled', 'returned'],
      },
      total_amount: {
        operator: 'between',
        type: 'number',
        value: 100,
        value2: 250,
      },
      vendor_name: {
        operator: 'contains',
        type: 'text',
        value: 'Acme',
      },
    });

    expect(result).toEqual({
      queryParams: [
        '2024-01-01',
        '2024-01-31',
        true,
        'cancelled',
        'returned',
        100,
        250,
        '%Acme%',
      ],
      whereClause:
        'WHERE created_at BETWEEN $1::date AND $2::date AND is_priority = $3 AND status NOT IN ($4, $5) AND total_amount BETWEEN $6 AND $7 AND vendor_name ILIKE $8',
    });
  });

  it('uses the operator-specific defaults for text, date, and select filters', () => {
    const result = buildEnterpriseOrdersWhereClause({
      ship_date: {
        operator: 'between',
        type: 'date',
        value: '2024-02-15',
      },
      status: {
        operator: 'notEquals',
        type: 'select',
        value: 'cancelled',
      },
      vendor_name: {
        operator: 'startsWith',
        type: 'text',
        value: 'North',
      },
    });

    expect(result).toEqual({
      queryParams: ['2024-02-15', 'cancelled', 'North%'],
      whereClause:
        'WHERE ship_date = $1::date AND status != $2 AND vendor_name ILIKE $3',
    });
  });
});
