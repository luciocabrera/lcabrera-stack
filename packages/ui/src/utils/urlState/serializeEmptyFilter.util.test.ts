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
    for (const code of ['ie', 'nie']) {
      expect(deserializeFilter([code])).toStrictEqual({
        operator: 'equals',
        type: 'select',
        values: [code],
      });
    }
  });

  it('round-trips such a select filter through the dispatcher', () => {
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
    expect(deserializeFilter({ op: 'zz' })).toBeUndefined();
    expect(deserializeFilter({ op: 7 })).toBeUndefined();
    expect(deserializeFilter({ operator: 'isEmpty' })).toBeUndefined();
    expect(deserializeFilter({})).toBeUndefined();
  });
});
