import { describe, expect, it } from 'vite-plus/test';

import type { KeysetSortEntry } from './build-keyset-branch.util.ts';

import { buildKeysetBranch } from './build-keyset-branch.util.ts';

const ORDER_DATE_DESC: KeysetSortEntry = {
  direction: 'desc',
  isNullValue: false,
  placeholder: '$1',
  quotedColumn: '"order_date"',
};

const DELIVERY_DATE_ASC_NULL: KeysetSortEntry = {
  direction: 'asc',
  isNullValue: true,
  placeholder: '$1',
  quotedColumn: '"delivery_date"',
};

const ORDER_ID_ASC: KeysetSortEntry = {
  direction: 'asc',
  isNullValue: false,
  placeholder: '$2',
  quotedColumn: '"order_id"',
};

const ENTRIES: readonly KeysetSortEntry[] = [ORDER_DATE_DESC, ORDER_ID_ASC];

describe('buildKeysetBranch', () => {
  it('advances the first column with no equality prefix', () => {
    expect(buildKeysetBranch({ entries: ENTRIES, index: 0 })).toBe(
      '"order_date" < $1',
    );
  });

  it('pins every earlier column to equality before advancing its own', () => {
    expect(buildKeysetBranch({ entries: ENTRIES, index: 1 })).toBe(
      '"order_date" IS NOT DISTINCT FROM $1 AND ("order_id" > $2 OR "order_id" IS NULL)',
    );
  });

  it('uses IS NOT DISTINCT FROM so a null cursor value ties instead of voiding the branch', () => {
    expect(
      buildKeysetBranch({
        entries: [DELIVERY_DATE_ASC_NULL, ORDER_ID_ASC],
        index: 1,
      }),
    ).toBe(
      '"delivery_date" IS NOT DISTINCT FROM $1 AND ("order_id" > $2 OR "order_id" IS NULL)',
    );
  });

  it('drops a branch nothing can sort after', () => {
    expect(
      buildKeysetBranch({ entries: [DELIVERY_DATE_ASC_NULL], index: 0 }),
    ).toBeUndefined();
  });

  it('returns undefined for an index past the end of the sort', () => {
    expect(buildKeysetBranch({ entries: ENTRIES, index: 2 })).toBeUndefined();
  });
});
