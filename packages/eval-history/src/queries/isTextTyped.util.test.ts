import { describe, expect, it } from 'vite-plus/test';

import { isTextTyped } from './isTextTyped.util.ts';

describe('isTextTyped', () => {
  it.each([
    { dataType: 'text', udtName: 'text' },
    { dataType: 'character varying', udtName: 'varchar' },
    { dataType: 'character', udtName: 'bpchar' },
    { dataType: 'ARRAY', udtName: '_text' },
    { dataType: 'ARRAY', udtName: '_varchar' },
    { dataType: 'ARRAY', udtName: '_bpchar' },
  ])('counts $dataType ($udtName) as text', (column) => {
    expect(isTextTyped(column)).toBe(true);
  });

  it.each([
    { dataType: 'integer', udtName: 'int4' },
    { dataType: 'jsonb', udtName: 'jsonb' },
    { dataType: 'USER-DEFINED', udtName: 'outcome' },
    { dataType: 'ARRAY', udtName: '_int4' },
    { dataType: 'ARRAY', udtName: '_outcome' },
    { dataType: 'timestamp with time zone', udtName: 'timestamptz' },
    { dataType: 'uuid', udtName: 'uuid' },
  ])('does not count $dataType ($udtName) as text', (column) => {
    expect(isTextTyped(column)).toBe(false);
  });
});
