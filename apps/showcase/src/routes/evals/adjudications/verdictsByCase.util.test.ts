import { describe, expect, it } from 'vite-plus/test';

import { VERDICTS } from './adjudications.fixtures';
import { verdictsByCase } from './verdictsByCase.util';

describe('verdictsByCase', () => {
  it('groups the verdicts by case, keeping their order', () => {
    const byCase = verdictsByCase(VERDICTS);

    expect(byCase.keys().toArray()).toEqual([
      'FP-0001',
      'FP-0002',
      'FP-0003',
      'FP-0004',
    ]);
    expect(byCase.get('FP-0002')?.map(({ model }) => model)).toEqual([
      'claude-opus-5-5',
      'claude-sonnet-5-5',
      'claude-fable-5-1',
    ]);
  });

  it('holds nothing for no verdicts', () => {
    expect(verdictsByCase([]).size).toBe(0);
  });
});
