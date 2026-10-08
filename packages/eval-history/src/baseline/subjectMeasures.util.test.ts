import { describe, expect, it } from 'vite-plus/test';

import { baselineFixtures } from './baselineFixtures.util.ts';
import { stubBaselineRun } from './stubBaselineRun.util.ts';
import { subjectMeasures } from './subjectMeasures.util.ts';

const { quality, skills } = await baselineFixtures();

describe('subjectMeasures', () => {
  it('measures the suite first and then each subject, undefined where nothing counted', () => {
    const envelope = stubBaselineRun({
      fixture: skills,
      trialsBySkill: {
        'react-19': [{ outcome: 'pass' }, { outcome: 'fail' }],
        unslop: [{ outcome: 'timeout' }],
      },
    });

    expect(subjectMeasures({ envelope, metric: 'pass_rate' })).toEqual([
      { subject: undefined, value: 0.5 },
      { subject: { kind: 'skill', name: 'react-19' }, value: 0.5 },
      { subject: { kind: 'skill', name: 'unslop' }, value: undefined },
    ]);
  });

  it('reads the quality score only from passing quality trials', () => {
    const envelope = stubBaselineRun({
      fixture: quality,
      trialsBySkill: {
        unslop: [
          { outcome: 'pass', overall: 2 },
          { outcome: 'pass', overall: 4 },
          { outcome: 'error', overall: 0 },
        ],
      },
    });

    expect(subjectMeasures({ envelope, metric: 'quality_overall' })).toEqual([
      { subject: undefined, value: 3 },
      { subject: { kind: 'skill', name: 'unslop' }, value: 3 },
    ]);
    expect(
      subjectMeasures({
        envelope: stubBaselineRun({
          fixture: skills,
          trialsBySkill: { 'react-19': [{ outcome: 'pass' }] },
        }),
        metric: 'quality_overall',
      }),
    ).toEqual([
      { subject: undefined, value: undefined },
      { subject: { kind: 'skill', name: 'react-19' }, value: undefined },
    ]);
  });
});
