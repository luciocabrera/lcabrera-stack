import { describe, expect, it } from 'vite-plus/test';

import { flipCell } from './flipCell.util.ts';
import { ABSENT_CELL } from './report.constants.ts';

describe('flipCell', () => {
  it('marks a task the run does not have', () => {
    expect(flipCell(undefined)).toBe(ABSENT_CELL);
  });

  it('prints passed over counted trials', () => {
    expect(flipCell({ excluded: 0, k: 2, n: 3 })).toBe('2/3');
  });

  it('notes the trials it did not count', () => {
    expect(flipCell({ excluded: 1, k: 2, n: 3 })).toBe('2/3 (+1 not counted)');
  });
});
