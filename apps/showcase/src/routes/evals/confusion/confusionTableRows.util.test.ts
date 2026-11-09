import { describe, expect, it } from 'vite-plus/test';

import {
  confusionColumnKey,
  confusionTableRows,
} from './confusionTableRows.util';

const CELL = { column: 'react-19', count: 2, isMisload: false, label: '2' };
const NONE = { column: '(none)', count: 1, isMisload: true, label: '1' };

describe('confusionTableRows', () => {
  it('keys each loaded column apart from the expectation and the trials', () => {
    expect(confusionColumnKey('trials')).toBe('loaded:trials');
  });

  it('lays one row per expectation, each cell under its loaded column', () => {
    expect(
      confusionTableRows({
        columns: ['react-19', '(none)'],
        rows: [{ cells: [CELL, NONE], expected: 'react-19', trials: 3 }],
      }),
    ).toEqual([
      {
        expected: 'react-19',
        'loaded:(none)': NONE,
        'loaded:react-19': CELL,
        trials: 3,
      },
    ]);
  });

  it('lays no row for an empty matrix', () => {
    expect(confusionTableRows({ columns: [], rows: [] })).toEqual([]);
  });
});
