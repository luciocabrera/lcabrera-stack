import { describe, expect, it } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';
import { resolveRowKey } from '#ui/components/Table/TableBodyRows/utils/resolveRowKey.util';

import { resolveGroupPathKey } from './resolveGroupPathKey.util';

describe('resolveGroupPathKey', () => {
  it('keys a group by its labels in key order, so the order is part of the identity', () => {
    const forward = resolveGroupPathKey([
      { columnKey: 'city', label: 'Berlin', value: 'Berlin' },
      { columnKey: 'status', label: 'Open', value: 'Open' },
    ]);
    const reversed = resolveGroupPathKey([
      { columnKey: 'status', label: 'Open', value: 'Open' },
      { columnKey: 'city', label: 'Berlin', value: 'Berlin' },
    ]);

    expect(forward).not.toBe(reversed);
  });

  it('keeps two paths distinct when a label contains the encoding characters', () => {
    // A delimiter-joined key collides here; the JSON tuple does not.
    const first = resolveGroupPathKey([
      { columnKey: 'city', label: 'a","b', value: 'a","b' },
      { columnKey: 'status', label: 'c', value: 'c' },
    ]);
    const second = resolveGroupPathKey([
      { columnKey: 'city', label: 'a', value: 'a' },
      { columnKey: 'status', label: 'b","c', value: 'b","c' },
    ]);

    expect(first).not.toBe(second);
  });

  it('ignores `value`, so a collapse stored before it existed still matches', () => {
    // The compatibility guarantee #775 has to keep. Expansion is persisted
    // under this string, so if `value` entered the encoding every stored
    // collapse would stop matching its row and silently re-expand. Two entries
    // differing only in `value` — including a NULL key, whose value and label
    // disagree most — must encode identically.
    // The NULL key is parsed rather than written as a literal — it is the
    // shape a SQL NULL actually arrives in, and the case where value and label
    // disagree most.
    const nullKey = JSON.parse(
      '{"columnKey":"status","label":"(empty)","value":null}',
    ) as TableGroupKeyValue;
    const stored = resolveGroupPathKey([
      { columnKey: 'city', label: 'Paris', value: 'Paris' },
      nullKey,
    ]);
    const rendered = resolveGroupPathKey([
      { columnKey: 'city', label: 'Paris', value: 'PARIS_ID_42' },
      { columnKey: 'status', label: '(empty)', value: undefined },
    ]);

    expect(rendered).toBe(stored);
  });

  it('still distinguishes two paths that differ only in label', () => {
    // The other half: ignoring `value` must not make the encoding coarser.
    const first = resolveGroupPathKey([
      { columnKey: 'city', label: 'Paris', value: 1 },
    ]);
    const second = resolveGroupPathKey([
      { columnKey: 'city', label: 'Berlin', value: 1 },
    ]);

    expect(first).not.toBe(second);
  });

  it('is the same encoding a rendered group row is keyed by', () => {
    // The load-bearing agreement: expansion is stored under this key and the
    // rendered row is identified by `resolveRowKey`, so a collapse could not be
    // re-applied after a refetch if the two encodings drifted.
    const path = [{ columnKey: 'city', label: 'Paris', value: 'Paris' }];
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
      resolveGroupPathKey([
        { columnKey: 'city', label: '\u{D800}', value: '\u{D800}' },
      ]),
    ).not.toThrow();
  });
});
