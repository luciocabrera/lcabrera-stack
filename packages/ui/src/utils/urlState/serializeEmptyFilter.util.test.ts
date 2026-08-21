import { describe, expect, it } from 'vite-plus/test';

import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { deserializeFilter } from './deserializeFilter.util';
import { serializeEmptyFilter } from './serializeEmptyFilter.util';
import { serializeFilter } from './serializeFilter.util';

const emptyFilter = { operator: 'isEmpty', type: 'empty' } as const;
const notEmptyFilter = { operator: 'isNotEmpty', type: 'empty' } as const;

describe('serializeEmptyFilter', () => {
  it('writes the operator code in an object', () => {
    expect(serializeEmptyFilter({ filter: emptyFilter })).toStrictEqual({
      op: 'ie',
    });
    expect(serializeEmptyFilter({ filter: notEmptyFilter })).toStrictEqual({
      op: 'nie',
    });
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

  it('leaves a select filter whose value is an operator code alone', () => {
    // The collision the object shape exists to avoid, asserted from the side
    // that would break: `serializeSelectFilter` writes an equals select filter
    // as its bare values, so `['ie']` is already that filter's compact form.
    // `ie` is a real country code and this package is published, so claiming
    // the array form would silently turn "country is ie" into "country is
    // empty" in a consumer's URL.
    for (const code of ['ie', 'nie']) {
      expect(deserializeFilter([code])).toStrictEqual({
        operator: 'equals',
        type: 'select',
        values: [code],
      });
    }
  });

  it('round-trips such a select filter through the dispatcher', () => {
    // The same boundary end to end, so a future short code cannot be added to
    // the array form without this failing.
    const filter = {
      operator: 'equals',
      type: 'select',
      values: ['ie'],
    } satisfies ColumnFilter;

    expect(deserializeFilter(serializeFilter({ filter }))).toStrictEqual(
      filter,
    );
  });

  it('refuses an object that is not this shape', () => {
    // The object arm is read before the array guard, so it must claim only
    // what it writes — anything else has to fall through as unparseable rather
    // than becoming an arbitrary empty filter.
    expect(deserializeFilter({ op: 'zz' })).toBeUndefined();
    expect(deserializeFilter({ op: 7 })).toBeUndefined();
    expect(deserializeFilter({ operator: 'isEmpty' })).toBeUndefined();
    expect(deserializeFilter({})).toBeUndefined();
  });
});
