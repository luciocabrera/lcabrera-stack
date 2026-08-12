import type { EnterpriseOrdersFilters } from 'api-shared';

import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { ENTERPRISE_ORDER_ALLOWED_COLUMNS, HttpError } from 'api-shared';
import { ENTERPRISE_ORDER_FILTER_CONTRACT_CASES } from 'api-shared/filter-contract';
import { describe, expect, it } from 'vite-plus/test';

import { parseEnterpriseOrdersFilters } from './enterpriseOrders.schema';

/**
 * The mid-edit states #567 was filed for, written out here rather than read
 * from the shared contract cases.
 *
 * That set anchors each filter variant's keys to the variant's own operator
 * union, so an operator cannot go unchecked. Its `drafting` group has no such
 * anchor — "a value the mappers drop" spans an absent key, an empty string and
 * an empty array, which share no closed vocabulary — so a case deleted from it
 * stops being checked and nothing fails. This is the copy that makes such a
 * deletion visible on this server: a named regression someone has to delete
 * deliberately.
 */
const DRAFTING_FILTERS = [
  {
    filters: { total_amount: { operator: 'equals', type: 'number' } },
    name: 'a number filter the user has not finished typing',
  },
  {
    filters: {
      total_amount: { operator: 'between', type: 'number', value: 10 },
    },
    name: 'a number range with no second bound yet',
  },
  {
    filters: {
      customer_name: { operator: 'contains', type: 'text', value: '' },
    },
    name: 'a text filter whose box has been cleared',
  },
  {
    filters: { order_date: { operator: 'after', type: 'date', value: '' } },
    name: 'a date filter with no date picked',
  },
  {
    filters: {
      payment_status: { operator: 'equals', type: 'select', value: '' },
    },
    name: 'a select filter with nothing chosen',
  },
  {
    filters: {
      order_status: { operator: 'equals', type: 'multiSelect', values: [] },
    },
    name: 'a multi-select filter with every option deselected',
  },
] as const;

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

  it.each(DRAFTING_FILTERS)(
    'accepts $name and builds no clause for it',
    ({ filters }) => {
      const parsed = parse(JSON.stringify(filters));

      expect(toQueryFilters({ filters: parsed })).toStrictEqual([]);
    },
  );

  it('restores the value key that JSON cannot carry', () => {
    const parsed = parse(
      JSON.stringify({
        total_amount: { operator: 'equals', type: 'number' },
      }),
    );

    expect(parsed).toStrictEqual({
      total_amount: { operator: 'equals', type: 'number', value: undefined },
    });
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
