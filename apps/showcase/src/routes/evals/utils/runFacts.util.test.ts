import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { runFacts } from './runFacts.util';

const run = {
  arch: 'x64',
  branch: 'main',
  costUsd: 1.5,
  durationMs: 2_400_000,
  gitSha: '0123456789abcdef0123456789abcdef01234567',
  harnessVersion: 'abcdefabcdef',
  k: 8,
  lower: 0.49,
  modelId: 'model-a',
  n: 10,
  node: 'v26',
  os: 'linux',
  rate: 0.8,
  runs: 3,
  startedAt: '2026-10-01T02:00:00.000Z',
  status: 'complete',
  suite: 'skills',
  trigger: 'ci-scheduled',
  upper: 0.94,
} as RunFigures;

const valuesOf = (facts: ReturnType<typeof runFacts>) =>
  Object.fromEntries(facts.map(({ term, value }) => [term, value]));

describe('runFacts', () => {
  it('lists a run’s figures in reading order', () => {
    const facts = runFacts(run);

    expect(facts.map(({ term }) => term)).toEqual([
      'Suite',
      'Pass rate',
      'Interval',
      'Cost',
      'Duration',
      'Status',
      'Trigger',
      'Branch',
      'Commit',
      'Started',
      'Model',
      'Harness',
      'Runs per task',
      'Node',
      'OS',
    ]);
    expect(valuesOf(facts)).toMatchObject({
      Commit: '0123456789ab',
      OS: 'linux x64',
      Started: '2026-10-01 02:00:00',
    });
  });

  it('says which figures the run did not record', () => {
    const facts = runFacts({
      ...run,
      arch: undefined,
      modelId: undefined,
      node: undefined,
      os: undefined,
      runs: undefined,
    });

    expect(valuesOf(facts)).toMatchObject({
      Model: 'none',
      Node: 'unknown',
      OS: 'unknown',
      'Runs per task': 'unknown',
    });
  });
});
