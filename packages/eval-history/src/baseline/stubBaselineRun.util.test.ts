import { describe, expect, it } from 'vite-plus/test';

import { parseEnvelope } from '../envelope/parseEnvelope.util.ts';
import { baselineFixtures } from './baselineFixtures.util.ts';
import { stubBaselineRun } from './stubBaselineRun.util.ts';

const { quality, rules, skills } = await baselineFixtures();

describe('stubBaselineRun', () => {
  it('builds envelopes the schema accepts, one task per skill', () => {
    const envelope = stubBaselineRun({
      baselineId: '11111111-1111-4111-8111-111111111111',
      fixture: skills,
      trialsBySkill: {
        'react-19': [{ outcome: 'pass' }, { outcome: 'error' }],
        unslop: [{ outcome: 'fail' }],
      },
    });

    expect(parseEnvelope(envelope).ok).toBe(true);
    expect(envelope.run.trigger).toBe('baseline');
    expect(envelope.tasks.map(({ task_key }) => task_key)).toEqual([
      'stub/react-19',
      'stub/unslop',
    ]);
  });

  it('sets the quality score and leaves other suites alone', () => {
    const scored = stubBaselineRun({
      fixture: quality,
      trialsBySkill: { unslop: [{ outcome: 'pass', overall: 2 }] },
    });
    const rule = stubBaselineRun({
      fixture: rules,
      trialsBySkill: { x: [{ outcome: 'pass', overall: 2 }] },
    });

    expect(parseEnvelope(scored).ok).toBe(true);
    expect(scored.trials[0]?.detail).toMatchObject({ overall: 2 });
    expect(rule.trials[0]?.detail.schema).toBe('rules/1');
    expect(rule.run.trigger).toBe('local');
  });

  it('refuses a fixture with no trial to copy', () => {
    expect(() =>
      stubBaselineRun({
        fixture: { ...skills, trials: [] },
        trialsBySkill: {},
      }),
    ).toThrow('the skills fixture lacks a subject, task or trial');
  });
});
