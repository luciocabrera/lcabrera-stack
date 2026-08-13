import { describe, expect, it } from 'vite-plus/test';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveGroupPathKey } from './resolveGroupPathKey.util';

describe('resolveGroupPathKey', () => {
  it('keys a group by its values in key order, so the order is part of the identity', () => {
    const forward = resolveGroupPathKey([
      { columnKey: 'city', label: 'Berlin' },
      { columnKey: 'status', label: 'Open' },
    ]);
    const reversed = resolveGroupPathKey([
      { columnKey: 'status', label: 'Open' },
      { columnKey: 'city', label: 'Berlin' },
    ]);

    expect(forward).not.toBe(reversed);
  });

  it('keeps two paths distinct when a label contains the encoding characters', () => {
    // A delimiter-joined key collides here; the JSON tuple does not.
    const first = resolveGroupPathKey([
      { columnKey: 'city', label: 'a","b' },
      { columnKey: 'status', label: 'c' },
    ]);
    const second = resolveGroupPathKey([
      { columnKey: 'city', label: 'a' },
      { columnKey: 'status', label: 'b","c' },
    ]);

    expect(first).not.toBe(second);
  });

  it('is the same encoding a rendered group row is keyed by', () => {
    // The load-bearing agreement: expansion is stored under this key and the
    // rendered row is identified by `resolveRowKey`, so a collapse could not be
    // re-applied after a refetch if the two encodings drifted.
    const path = [{ columnKey: 'city', label: 'Paris' }];
    const rowKey = resolveRowKey({
      columns: [],
      index: 0,
      row: {
        [TABLE_GROUP_ROW_FIELD]: {
          aggregates: [],
          count: 1,
          isSubtotal: false,
          path,
        },
      },
    });

    expect(rowKey).toContain(resolveGroupPathKey(path));
  });

  it('does not throw on a lone surrogate, because it runs on the render path', () => {
    expect(() =>
      resolveGroupPathKey([{ columnKey: 'city', label: '\u{D800}' }]),
    ).not.toThrow();
  });
});
