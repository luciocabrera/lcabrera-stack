import { describe, expect, it } from 'vite-plus/test';

import { baselineFixtures } from './baselineFixtures.service.ts';
import { baselineRun } from './baselineRun.util.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { rules, skills } = await baselineFixtures();

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

  it('excludes a run the session limit cut off, with that reason', () => {
    const envelope = stubBaselineRun({
      baselineId: BASELINE,
      fixture: skills,
      status: 'partial',
      trialsBySkill: {
        'react-19': [
          { outcome: 'pass' },
          { errorClass: 'session_limit', outcome: 'error' },
        ],
      },
    });

    expect(baselineRun(envelope)).toEqual({
      kind: 'excluded',
      reason: `run ${envelope.run.run_id} was cut off by the session limit, so it is left out`,
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

  it('says a model suite run recorded no model rather than that it calls none', () => {
    const tagged = stubBaselineRun({
      baselineId: BASELINE,
      fixture: skills,
      trialsBySkill: { 'react-19': [{ outcome: 'pass' }] },
    });
    const envelope = {
      ...tagged,
      run: { ...tagged.run, model_id: rules.run.model_id },
    };

    expect(envelope.run.model_id).toBeNull();

    expect(baselineRun(envelope)).toEqual({
      kind: 'excluded',
      reason: `run ${envelope.run.run_id} recorded no model, so it cannot join a skills baseline`,
    });
  });

  it('says a suite with no baseline calls no model', () => {
    const envelope = {
      ...rules,
      run: {
        ...rules.run,
        baseline_id: BASELINE,
        git_dirty: false,
        status: 'complete',
      },
    } as const;

    expect(baselineRun(envelope)).toEqual({
      kind: 'excluded',
      reason: `run ${envelope.run.run_id} is a rules-consistency run, which calls no model and has no baseline`,
    });
  });

  it('excludes a run whose every trial ended in error and says why', () => {
    const envelope = stubBaselineRun({
      baselineId: BASELINE,
      fixture: skills,
      trialsBySkill: { 'react-19': [{ outcome: 'error' }] },
    });

    expect(baselineRun(envelope)).toEqual({
      kind: 'excluded',
      reason: `every trial of run ${envelope.run.run_id} ended in error, which points at the harness rather than the model, so it is left out`,
    });
  });
});
