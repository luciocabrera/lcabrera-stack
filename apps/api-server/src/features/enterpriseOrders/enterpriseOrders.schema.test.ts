import type { EnterpriseOrdersFilters } from 'api-shared';

import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import {
  ENTERPRISE_ORDER_ALLOWED_COLUMNS,
  ENTERPRISE_ORDER_FILTER_CONTRACT_CASES,
  HttpError,
} from 'api-shared';
import { describe, expect, it } from 'vite-plus/test';

import { parseEnterpriseOrdersFilters } from './enterpriseOrders.schema';

/**
 * The `filter` payload this schema validates is also served, unvalidated, by
 * the React Router route (`_api/enterprise-orders/paginated`), which hands the
 * parsed JSON straight to `toQueryFilters`. The two therefore have to agree on
 * what a filter is, and the only thing standing between them is that this file
 * restates the shape in Zod — a copy no type can check.
 *
 * So the assertion is behavioural and runs on both halves of the same payload:
 * this route must accept every state in the shared contract, and must reach the
 * query layer with exactly the clauses the React Router route would have built
 * from the identical JSON. A stricter Zod rule shows up as a rejection here; a
 * looser one shows up as a different clause set.
 */
/** Parses the wire form — a JSON string — exactly as the route receives it. */
const parse = (wireFilters: string) =>
  parseEnterpriseOrdersFilters({
    allowedColumns: ENTERPRISE_ORDER_ALLOWED_COLUMNS,
    value: wireFilters,
  });

describe('parseEnterpriseOrdersFilters', () => {
  it.each(ENTERPRISE_ORDER_FILTER_CONTRACT_CASES)(
    'accepts $name and builds the same clauses as the React Router route',
    ({ filters }) => {
      // The wire form, not the fixture object: JSON has no way to carry
      // `value: undefined`, so a drafting filter loses the key in transit and
      // that is the shape both routes actually receive.
      const wireFilters = JSON.stringify(filters);
      const routeFilters = JSON.parse(wireFilters) as EnterpriseOrdersFilters;

      expect(toQueryFilters({ filters: parse(wireFilters) })).toStrictEqual(
        toQueryFilters({ filters: routeFilters }),
      );
    },
  );

  it('accepts a number filter the user has not finished typing, and builds no clause for it', () => {
    const parsed = parse(
      JSON.stringify({
        total_amount: { operator: 'equals', type: 'number' },
      }),
    );

    expect(parsed).toStrictEqual({
      total_amount: { operator: 'equals', type: 'number', value: undefined },
    });
    expect(toQueryFilters({ filters: parsed })).toStrictEqual([]);
  });

  it('still rejects an operator outside the contract', () => {
    const wireFilters = JSON.stringify({
      total_amount: { operator: 'divides', type: 'number' },
    });

    expect(() => parse(wireFilters)).toThrow(HttpError);
  });

  it('still rejects a filter on a column that is not allow-listed', () => {
    const wireFilters = JSON.stringify({
      internal_secret: { operator: 'equals', type: 'text', value: '' },
    });

    expect(() => parse(wireFilters)).toThrow(HttpError);
  });
});
