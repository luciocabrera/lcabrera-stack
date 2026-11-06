import { describe, expect, it } from 'vite-plus/test';

import { isDotDrawn } from './isDotDrawn.util';

const PLAIN = { x: 0, y: 1 };
const LINKED = { ...PLAIN, to: '/points/0' };
const TONED = { ...PLAIN, tone: 'error' as const };

describe('isDotDrawn', () => {
  it.each([
    { drawnCount: 100, mode: 'never' as const, point: LINKED },
    { drawnCount: 100, mode: 'auto' as const, point: LINKED },
    { drawnCount: 100, mode: 'always' as const, point: PLAIN },
    { drawnCount: 100, mode: 'auto' as const, point: TONED },
    { drawnCount: 24, mode: 'auto' as const, point: PLAIN },
  ])('draws a dot in $mode mode for $point of $drawnCount', (args) => {
    expect(isDotDrawn(args)).toBe(true);
  });

  it.each([
    { drawnCount: 1, mode: 'never' as const, point: TONED },
    { drawnCount: 25, mode: 'auto' as const, point: PLAIN },
    { drawnCount: 1, mode: 'never' as const, point: PLAIN },
  ])('draws no dot in $mode mode for $point of $drawnCount', (args) => {
    expect(isDotDrawn(args)).toBe(false);
  });
});
