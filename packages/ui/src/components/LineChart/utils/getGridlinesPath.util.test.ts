import { describe, expect, it } from 'vite-plus/test';

import { getGridlinesPath } from './getGridlinesPath.util';

describe('getGridlinesPath', () => {
  it('draws one full-width line per tick', () => {
    expect(getGridlinesPath({ ticks: [{ at: 0 }, { at: 50 }] })).toBe(
      'M0,0L100,0M0,50L100,50',
    );
  });

  it('draws nothing without ticks', () => {
    expect(getGridlinesPath({ ticks: [] })).toBe('');
  });
});
