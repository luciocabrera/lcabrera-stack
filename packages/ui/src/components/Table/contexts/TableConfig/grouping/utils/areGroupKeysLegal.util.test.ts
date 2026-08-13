import { describe, expect, it } from 'vite-plus/test';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { areGroupKeysLegal } from './areGroupKeysLegal.util';

const keysOfLength = (length: number) =>
  Array.from({ length }, (_unused, index) => `key_${index}`);

describe('areGroupKeysLegal', () => {
  it('accepts an empty list', () => {
    // Ungrouped is a legal shape; turning it into "no grouping" is the caller's
    // normalisation, not a refusal.
    expect(areGroupKeysLegal([])).toBe(true);
  });

  it('accepts distinct keys up to the cap', () => {
    expect(areGroupKeysLegal(keysOfLength(MAX_TABLE_GROUP_KEYS))).toBe(true);
  });

  it('refuses one key past the cap', () => {
    expect(areGroupKeysLegal(keysOfLength(MAX_TABLE_GROUP_KEYS + 1))).toBe(
      false,
    );
  });

  it('refuses a repeated key', () => {
    expect(areGroupKeysLegal(['order_status', 'order_status'])).toBe(false);
    expect(
      areGroupKeysLegal(['order_status', 'priority', 'order_status']),
    ).toBe(false);
  });

  it('refuses a repeat even well inside the cap', () => {
    // The two invariants are independent: a short list can still be illegal.
    expect(areGroupKeysLegal(['a', 'a'])).toBe(false);
  });

  it('answers the shape question only, not which columns exist', () => {
    // A key naming no column of the table is a legal *shape* — refusing it is
    // `sanitizeGroupingByColumns`'s job, which is the only side that has the
    // columns to check against.
    expect(areGroupKeysLegal(['not_a_column'])).toBe(true);
  });
});
