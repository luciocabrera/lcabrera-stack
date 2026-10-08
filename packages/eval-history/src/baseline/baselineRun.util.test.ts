import { describe, expect, it } from 'vite-plus/test';

import { baselineFixtures } from './baselineFixtures.util.ts';
import { baselineRun } from './baselineRun.util.ts';
import { stubBaselineRun } from './stubBaselineRun.util.ts';

const { skills } = await baselineFixtures();

const BASELINE = '11111111-1111-4111-8111-111111111111';

describe('baselineRun', () => {
  it('admits a complete, clean, tagged run of a model suite', () => {
    const envelope = stubBaselineRun({
      baselineId: BASELINE,
      fixture: skills,
      modelId: 'model-a',
      trialsBySkill: { 'react-19': [{ outcome: 'pass' }] },
    });

    expect(baselineRun(envelope)).toEqual({
      baselineId: BASELINE,
      envelope,
      gitSha: 'a'.repeat(40),
      kind: 'run',
      modelId: 'model-a',
      suite: 'skills',
    });
  });

  it('excludes an aborted run and says why', () => {
    const envelope = stubBaselineRun({
      baselineId: BASELINE,
      fixture: skills,
      status: 'aborted',
      trialsBySkill: { 'react-19': [{ outcome: 'pass' }] },
    });

    expect(baselineRun(envelope)).toEqual({
      kind: 'excluded',
      reason: `run ${envelope.run.run_id} is aborted, so it is left out`,
    });
  });
});
