import { describe, expect, it } from 'vite-plus/test';

import { buildProjectedColumn } from './build-projected-column.util.ts';

describe('buildProjectedColumn', () => {
  it('leaves an unaliased column as it is', () => {
    expect(
      buildProjectedColumn({ isAliased: false, name: 'id', sql: '"id"' }),
    ).toBe('"id"');
  });

  it('aliases a column to its projected name', () => {
    expect(
      buildProjectedColumn({
        isAliased: true,
        name: 'vendor.name',
        sql: '"vendor"."name"',
      }),
    ).toBe('"vendor"."name" AS "vendor.name"');
  });

  it('accepts a 63-byte alias and refuses a 64-byte one', () => {
    const atLimit = `${'a'.repeat(58)}.name`;
    const pastLimit = `${'a'.repeat(59)}.name`;

    expect(
      buildProjectedColumn({ isAliased: true, name: atLimit, sql: '"x"' }),
    ).toBe(`"x" AS "${atLimit}"`);
    expect(() =>
      buildProjectedColumn({ isAliased: true, name: pastLimit, sql: '"x"' }),
    ).toThrow(`The projected alias "${pastLimit}" is longer`);
  });
});
