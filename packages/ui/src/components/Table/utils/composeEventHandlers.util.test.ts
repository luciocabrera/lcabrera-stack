import { describe, expect, it, vi } from 'vite-plus/test';

import { composeEventHandlers } from './composeEventHandlers.util';

describe('composeEventHandlers', () => {
  it('returns the grid handler itself when the consumer gave none', () => {
    const grid = vi.fn();

    expect(composeEventHandlers({ consumer: undefined, grid })).toBe(grid);
  });

  it('runs the consumer and then the grid, each with the event', () => {
    const calls: string[] = [];
    const composed = composeEventHandlers<string>({
      consumer: (event) => {
        calls.push(`consumer ${event}`);
      },
      grid: (event) => {
        calls.push(`grid ${event}`);
      },
    });

    composed('keydown');

    expect(calls).toStrictEqual(['consumer keydown', 'grid keydown']);
  });
});
