import { describe, expect, it } from 'vite-plus/test';

import { flipTable } from './flipTable.util.ts';

const labels = { a: 'main', b: 'feat/x' };

describe('flipTable', () => {
  it('says so when no task flipped', () => {
    expect(flipTable({ flips: [], labels })).toBe('No task changed outcome.');
  });

  it('prints one row per flipped task under the side labels', () => {
    expect(
      flipTable({
        flips: [
          { a: { excluded: 0, k: 3, n: 3 }, taskKey: 't-1' },
          { b: { excluded: 1, k: 0, n: 2 }, taskKey: 't-2' },
        ],
        labels,
      }).split('\n'),
    ).toEqual([
      '| Task | main | feat/x |',
      '| --- | --- | --- |',
      '| t-1 | 3/3 | — |',
      '| t-2 | — | 0/2 (+1 not counted) |',
    ]);
  });
});
