import { describe, expect, it } from 'vite-plus/test';

import { getUsedPatterns } from './getUsedPatterns.util';

const CELL = { column: 'c', label: 'Cell', row: 'r' };

describe('getUsedPatterns', () => {
  it('is empty when nothing names a pattern', () => {
    expect(getUsedPatterns({ cells: [CELL], legend: undefined })).toEqual([]);
  });

  it('lists a pattern a cell names', () => {
    expect(
      getUsedPatterns({
        cells: [{ ...CELL, pattern: 'hatch' }],
        legend: undefined,
      }),
    ).toEqual(['hatch']);
  });

  it('lists a pattern only the legend names', () => {
    expect(
      getUsedPatterns({
        cells: [CELL],
        legend: [{ label: 'Dotted', pattern: 'dots' }],
      }),
    ).toEqual(['dots']);
  });

  it('lists each pattern once however many name it', () => {
    expect(
      getUsedPatterns({
        cells: [
          { ...CELL, pattern: 'hatch' },
          { ...CELL, pattern: 'dots' },
          { ...CELL, pattern: 'hatch' },
        ],
        legend: [{ label: 'Hatched', pattern: 'hatch' }],
      }),
    ).toEqual(['dots', 'hatch']);
  });
});
