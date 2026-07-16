import { describe, expect, it } from 'vitest';

import { serializeTextFilter } from './serializeTextFilter.util';

describe('serializeTextFilter', () => {
  it('returns [op, value]', () => {
    expect(
      serializeTextFilter({
        filter: { operator: 'contains', type: 'text', value: 'hello' },
      }),
    ).toEqual(['ct', 'hello']);
  });
});
