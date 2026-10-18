import { describe, expect, it } from 'vite-plus/test';

import { hiddenSkillOutcomes } from './hiddenSkillOutcomes.util.ts';

describe('hiddenSkillOutcomes', () => {
  const outcomesOf = hiddenSkillOutcomes('react-19');

  it("fails every trial of the hidden skill's trigger tasks", () => {
    expect(outcomesOf('react-19/trigger')).toEqual(['fail', 'fail', 'fail']);
    expect(outcomesOf('react-19/trigger-2')).toEqual(['fail', 'fail', 'fail']);
  });

  it('passes its near-miss tasks and every task of another skill', () => {
    expect(outcomesOf('react-19/near-miss')).toEqual(['pass', 'pass', 'pass']);
    expect(outcomesOf('store-pattern/trigger')).toEqual([
      'pass',
      'pass',
      'pass',
    ]);
  });
});
