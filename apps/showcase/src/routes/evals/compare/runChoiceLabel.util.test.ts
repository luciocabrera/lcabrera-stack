import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { runChoiceLabel } from './runChoiceLabel.util';

describe('runChoiceLabel', () => {
  it('names a run by suite, start, branch and pass rate', () => {
    expect(
      runChoiceLabel({
        branch: 'main',
        k: 3,
        n: 4,
        rate: 0.75,
        startedAt: '2026-10-01T02:00:00.000Z',
        suite: 'skills',
      } as RunFigures),
    ).toBe('skills, 2026-10-01 02:00 on main: 75% (3/4)');
  });
});
