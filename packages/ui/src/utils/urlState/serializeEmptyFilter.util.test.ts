import { describe, expect, it } from 'vite-plus/test';

import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { deserializeFilter } from './deserializeFilter.util';
import { serializeEmptyFilter } from './serializeEmptyFilter.util';

const emptyFilter = { operator: 'isEmpty', type: 'empty' } as const;
const notEmptyFilter = { operator: 'isNotEmpty', type: 'empty' } as const;

describe('serializeEmptyFilter', () => {
  it('writes the operator alone', () => {
    expect(serializeEmptyFilter({ filter: emptyFilter })).toStrictEqual(['ie']);
    expect(serializeEmptyFilter({ filter: notEmptyFilter })).toStrictEqual([
      'nie',
    ]);
  });

  it('round-trips both operators', () => {
    // The codec is two halves and nothing but this asserts they agree.
    for (const filter of [
      emptyFilter,
      notEmptyFilter,
    ] satisfies ColumnFilter[]) {
      expect(deserializeFilter(serializeEmptyFilter({ filter }))).toStrictEqual(
        filter,
      );
    }
  });

  it('is not read as a select filter matching the operator code', () => {
    // The trap this shape sits next to. `parseEqualsSelectFilter` is the last
    // fallback and accepts any all-string array, so without its own arm ahead
    // of it `['ie']` deserializes to `{type: 'select', values: ['ie']}` — a
    // filter that looks reasonable, matches nothing, and says nothing about
    // being the wrong one.
    expect(deserializeFilter(['ie'])).toStrictEqual(emptyFilter);
  });

  it('leaves a genuine one-value select filter alone', () => {
    // The other side of that boundary: a real select filter is still a real
    // select filter, so the new arm must claim only the operator codes.
    expect(deserializeFilter(['pending'])).toStrictEqual({
      operator: 'equals',
      type: 'select',
      values: ['pending'],
    });
  });

  it('does not claim a longer array that happens to start with the code', () => {
    // `['ie', 'x']` is not a shape this codec writes, so it belongs to whoever
    // else can parse it rather than being read as an empty filter with junk.
    expect(deserializeFilter(['ie', 'x'])).toStrictEqual({
      operator: 'equals',
      type: 'select',
      values: ['ie', 'x'],
    });
  });
});
