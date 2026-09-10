import { describe, expect, it } from 'vite-plus/test';

import { POSTGRES_MAX_HEAP_ATTRIBUTES } from './group-query-builder.constants.ts';
import { toColumnAxisDiscoveryLimit } from './to-column-axis-discovery-limit.util.ts';

describe('toColumnAxisDiscoveryLimit', () => {
  it('is maxDistinct plus one when that still fits the heap', () => {
    expect(
      toColumnAxisDiscoveryLimit({
        keyCount: 1,
        maxDistinct: 8,
        measureCount: 1,
      }),
    ).toBe(9);
  });

  it('clamps to the heap ceiling when maxDistinct is larger', () => {
    const maxByHeap = POSTGRES_MAX_HEAP_ATTRIBUTES - 1 - 1;

    expect(
      toColumnAxisDiscoveryLimit({
        keyCount: 1,
        maxDistinct: 50_000,
        measureCount: 1,
      }),
    ).toBe(maxByHeap + 1);
  });

  it('ignores the heap when there are no measures to project', () => {
    expect(
      toColumnAxisDiscoveryLimit({
        keyCount: 1,
        maxDistinct: 8,
        measureCount: 0,
      }),
    ).toBe(9);
  });

  it('reserves a leading unexpanded count(*) before dividing the heap', () => {
    const withoutCount = toColumnAxisDiscoveryLimit({
      keyCount: 1,
      maxDistinct: 50_000,
      measureCount: 1,
    });
    const withCount = toColumnAxisDiscoveryLimit({
      fixedAggregateCount: 1,
      keyCount: 1,
      maxDistinct: 50_000,
      measureCount: 1,
    });

    expect(withCount).toBe(withoutCount - 1);
  });
});
