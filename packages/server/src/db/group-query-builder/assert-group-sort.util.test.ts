import { describe, expect, it } from 'vite-plus/test';

import { assertGroupSort } from './assert-group-sort.util.ts';

const KEYS = ['order_status', 'shipping_country'];
const ALIASES = ['count_rows', 'sum_total_amount'];

const assert = (sort: Parameters<typeof assertGroupSort>[0]['sort']) =>
  assertGroupSort({ aggregateAliases: ALIASES, keys: KEYS, sort });

describe('assertGroupSort', () => {
  it('accepts an empty sort', () => {
    expect(() => assert([])).not.toThrow();
  });

  it('accepts an aggregate sort listed after every key', () => {
    // The innermost-level sort: legal, and the one shape that orders leaves
    // within their parent without touching the tree above them.
    expect(() =>
      assert([
        { direction: 'asc', key: 'order_status' },
        { direction: 'asc', key: 'shipping_country' },
        { aggregateAlias: 'sum_total_amount', direction: 'desc' },
      ]),
    ).not.toThrow();
  });

  it('accepts an aggregate sort with no key sort beside it', () => {
    expect(() =>
      assert([{ aggregateAlias: 'sum_total_amount', direction: 'desc' }]),
    ).not.toThrow();
  });

  it('refuses an aggregate listed ahead of a group key', () => {
    // The ancestor-ranking request. Refused rather than demoted behind the key,
    // because a demoted term orders nothing and reads as having been applied.
    expect(() =>
      assert([
        { aggregateAlias: 'sum_total_amount', direction: 'desc' },
        { direction: 'asc', key: 'order_status' },
      ]),
    ).toThrow('never rank an ancestor');
  });

  it('names both the aggregate and the key it was listed ahead of', () => {
    expect(() =>
      assert([
        { aggregateAlias: 'count_rows', direction: 'desc' },
        { direction: 'asc', key: 'shipping_country' },
      ]),
    ).toThrow(/"count_rows".+"shipping_country"/);
  });

  it('refuses an aggregate ahead of a key even at the innermost level', () => {
    // Both keys are still sorted, so the tree is intact by every other
    // measure — but the aggregate now separates rows that key order had not,
    // one level above where it may act.
    expect(() =>
      assert([
        { direction: 'asc', key: 'order_status' },
        { aggregateAlias: 'sum_total_amount', direction: 'desc' },
        { direction: 'asc', key: 'shipping_country' },
      ]),
    ).toThrow('never rank an ancestor');
  });

  it('refuses a sort on a column that is not a group key', () => {
    expect(() => assert([{ direction: 'asc', key: 'city' }])).toThrow(
      "it is not one of this query's group keys",
    );
  });

  it('refuses a sort on an alias this query does not project', () => {
    expect(() =>
      assert([{ aggregateAlias: 'avg_total_amount', direction: 'asc' }]),
    ).toThrow("it is not one of this query's aggregates");
  });
});
