import { describe, expect, it } from 'vite-plus/test';

import { listUnknownKeys } from './listUnknownKeys.util';

describe('listUnknownKeys', () => {
  it('lists the keys outside the allowed set', () => {
    expect(
      listUnknownKeys({
        allowed: new Set(['gte', 'tone']),
        record: { gt: 4, tone: 'x' },
      }),
    ).toEqual(['gt']);
  });

  it('answers an empty list when every key is allowed', () => {
    expect(
      listUnknownKeys({ allowed: new Set(['a']), record: { a: 1 } }),
    ).toEqual([]);
  });
});
