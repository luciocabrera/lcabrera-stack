import { describe, expect, it } from 'vite-plus/test';

import { baselineFixtures } from './baselineFixtures.service.ts';
import { harnessProblem } from './harnessProblem.util.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { skills } = await baselineFixtures();

describe('harnessProblem', () => {
  it('passes a complete run with a trial that reached the model', () => {
    expect(
      harnessProblem(
        stubBaselineRun({
          fixture: skills,
          trialsBySkill: {
            'react-19': [{ outcome: 'error' }, { outcome: 'fail' }],
          },
        }),
      ),
    ).toBeUndefined();
  });

  it('names a run whose every trial ended in error', () => {
    const envelope = stubBaselineRun({
      fixture: skills,
      trialsBySkill: {
        'react-19': [{ outcome: 'error' }, { outcome: 'error' }],
      },
    });

    expect(harnessProblem(envelope)).toBe(
      `every trial of run ${envelope.run.run_id} ended in error, which points at the harness rather than the model`,
    );
  });

  it('names a run with no trials', () => {
    const envelope = stubBaselineRun({ fixture: skills, trialsBySkill: {} });

    expect(harnessProblem(envelope)).toBe(
      `run ${envelope.run.run_id} recorded no trials`,
    );
  });

  it('names a run its runner did not finish', () => {
    const envelope = stubBaselineRun({
      fixture: skills,
      status: 'partial',
      trialsBySkill: { 'react-19': [{ outcome: 'pass' }] },
    });

    expect(harnessProblem(envelope)).toBe(
      `run ${envelope.run.run_id} is partial, so its runner stopped before it finished`,
    );
  });
});
