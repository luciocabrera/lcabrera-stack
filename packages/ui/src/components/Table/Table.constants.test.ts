import { describe, expect, it } from 'vite-plus/test';

import {
  MAX_TABLE_GROUP_KEYS,
  TABLE_AGGREGATE_FNS,
  TABLE_AGGREGATE_LABELS,
} from './Table.constants';

describe('table aggregate vocabulary', () => {
  it('offers every aggregate the label map declares, and no other', () => {
    // `TABLE_AGGREGATE_LABELS` is closed over `TableAggregateFn`, so a member
    // added to the union forces an entry there. This is what then forces it
    // into the ordered list the menus render from — without it a new member
    // would type-check everywhere and simply never appear.
    expect(new Set(TABLE_AGGREGATE_FNS)).toStrictEqual(
      new Set(Object.keys(TABLE_AGGREGATE_LABELS)),
    );
  });

  it('lists each aggregate once', () => {
    expect(TABLE_AGGREGATE_FNS).toHaveLength(new Set(TABLE_AGGREGATE_FNS).size);
  });
});

describe('group key depth cap', () => {
  it('admits more than one key and stays finite', () => {
    // The value itself is pinned against the server's in the app's conformance
    // test; what belongs here is only that this package's own cap permits the
    // multi-key grouping built on top of it.
    expect(MAX_TABLE_GROUP_KEYS).toBeGreaterThan(1);
    expect(Number.isSafeInteger(MAX_TABLE_GROUP_KEYS)).toBe(true);
  });
});
