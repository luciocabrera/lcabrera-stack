import { describe, expect, it } from 'vite-plus/test';

import { runWhenLabel } from './runWhenLabel.util';

describe('runWhenLabel', () => {
  it('names a run by its start to the minute and its branch', () => {
    expect(
      runWhenLabel({ branch: 'main', startedAt: '2026-10-05T02:07:41.000Z' }),
    ).toBe('2026-10-05 02:07 on main');
  });
});
