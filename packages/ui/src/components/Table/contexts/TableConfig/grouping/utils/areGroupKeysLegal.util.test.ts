import { describe, expect, it } from 'vite-plus/test';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import { areGroupKeysLegal } from './areGroupKeysLegal.util';

const keysOfLength = (length: number) =>
  Array.from({ length }, (_unused, index) => `key_${index}`);

describe('areGroupKeysLegal', () => {
  it('accepts an empty list', () => {
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
    expect(areGroupKeysLegal(['a', 'a'])).toBe(false);
  });

  it('answers the shape question only, not which columns exist', () => {
    expect(areGroupKeysLegal(['not_a_column'])).toBe(true);
  });
});
