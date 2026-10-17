import { describe, expect, it } from 'vite-plus/test';

import { baselineFixtures } from './baselineFixtures.service.ts';
import { sessionLimitProblem } from './sessionLimitProblem.util.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { skills } = await baselineFixtures();

describe('sessionLimitProblem', () => {
  it('names a run with a trial the session limit stopped', () => {
    const envelope = stubBaselineRun({
      fixture: skills,
      status: 'partial',
      trialsBySkill: {
        'react-19': [
          { outcome: 'pass' },
          { errorClass: 'session_limit', outcome: 'error' },
        ],
      },
    });

    expect(sessionLimitProblem(envelope)).toBe(
      `run ${envelope.run.run_id} was cut off by the session limit`,
    );
  });

  it('passes a run whose errors are of any other class', () => {
    expect(
      sessionLimitProblem(
        stubBaselineRun({
          fixture: skills,
          trialsBySkill: {
            'react-19': [{ errorClass: 'rate_limit', outcome: 'error' }],
          },
        }),
      ),
    ).toBeUndefined();
  });
});
