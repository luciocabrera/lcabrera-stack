/**
 * Every rule here exists because Postgres fails it quietly. The probe behind
 * the length rule is in ADR-059: two aliases sharing their first 63 characters
 * produce two `NOTICE` lines, no error, and a row object with a single key
 * holding the second value.
 */
import { describe, expect, it } from 'vite-plus/test';

import { assertGroupAliases } from './assert-group-aliases.util.ts';

const ALLOWED = ['order_status', 'total_amount', 'group_mask'];

describe('assertGroupAliases', () => {
  it('accepts distinct aliases that no column is named after', () => {
    expect(() =>
      assertGroupAliases({
        aliases: ['group_mask', 'count_rows', 'sum_total_amount'],
        allowedColumns: ['order_status', 'total_amount'],
      }),
    ).not.toThrow();
  });

  it('refuses an alias that collides with a real column', () => {
    // A table with its own `group_mask` column would otherwise project two
    // columns of that name and the driver would keep one.
    expect(() =>
      assertGroupAliases({
        aliases: ['group_mask'],
        allowedColumns: ALLOWED,
      }),
    ).toThrow('collides with a real column');
  });

  it('refuses the same alias projected twice', () => {
    expect(() =>
      assertGroupAliases({
        aliases: ['count_rows', 'count_rows'],
        allowedColumns: [],
      }),
    ).toThrow('projected more than once');
  });

  it('accepts an alias at exactly the identifier limit', () => {
    expect(() =>
      assertGroupAliases({ aliases: ['a'.repeat(63)], allowedColumns: [] }),
    ).not.toThrow();
  });

  it('refuses an alias one character past the limit', () => {
    expect(() =>
      assertGroupAliases({ aliases: ['a'.repeat(64)], allowedColumns: [] }),
    ).toThrow('identifier limit');
  });

  it('refuses two aliases that differ only past the limit', () => {
    // The failure this whole rule exists for. Both truncate to the same 63
    // characters, which Postgres reports as a NOTICE and nothing else.
    const shared = 'a'.repeat(62);

    expect(() =>
      assertGroupAliases({
        aliases: [`${shared}_first`, `${shared}_second`],
        allowedColumns: [],
      }),
    ).toThrow('identifier limit');
  });

  it('refuses an unsafe alias', () => {
    expect(() =>
      assertGroupAliases({ aliases: ['Sum Total'], allowedColumns: [] }),
    ).toThrow('Unsafe identifier');
  });
});
