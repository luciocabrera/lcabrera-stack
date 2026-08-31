import { describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveDeclaredGroupingKeys } from './resolveDeclaredGroupingKeys.util';

type Row = { readonly amount: number; readonly city: string };

const columns: TableColumn<Row>[] = [
  { key: 'city', label: 'City' },
  { key: 'amount', label: 'Amount' },
];

const resolve = (groupingKeys: readonly string[]) =>
  resolveDeclaredGroupingKeys<Row>({ columns, groupingKeys });

describe('resolveDeclaredGroupingKeys', () => {
  it('keeps the keys naming a declared column, in key order', () => {
    expect(resolve(['amount', 'city'])).toStrictEqual(['amount', 'city']);
  });

  it('skips a key naming no declared column', () => {
    expect(resolve(['not_a_column', 'city'])).toStrictEqual(['city']);
  });

  it('returns the same reference when nothing is grouped', () => {
    const groupingKeys: readonly string[] = [];

    expect(resolve(groupingKeys)).toBe(groupingKeys);
  });

  it('agrees with the hoist about which key is first', () => {
    expect(resolve(['not_a_column', 'city', 'amount'])[0]).toBe('city');
  });
});
