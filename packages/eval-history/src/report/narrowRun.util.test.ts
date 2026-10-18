import { describe, expect, it } from 'vite-plus/test';

import { narrowRun } from './narrowRun.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';
import { reportTaskFixture } from './reportTaskFixture.util.ts';

const run = reportRunFixture({
  subjects: [
    { contentHash: 'c1', kind: 'skill', name: 'react-19' },
    { contentHash: 'c2', kind: 'skill', name: 'store-pattern' },
  ],
  tasks: [
    reportTaskFixture(),
    reportTaskFixture({
      subject: { kind: 'skill', name: 'store-pattern' },
      taskKey: 'skills/store-pattern/trigger-1',
    }),
  ],
});

describe('narrowRun', () => {
  it('returns the run unchanged when no subject is named', () => {
    expect(narrowRun({ run, subjects: [] })).toBe(run);
  });

  it('keeps only the named subjects and their tasks', () => {
    const narrowed = narrowRun({ run, subjects: ['store-pattern'] });

    expect(narrowed.subjects.map(({ name }) => name)).toEqual([
      'store-pattern',
    ]);
    expect(narrowed.tasks.map(({ taskKey }) => taskKey)).toEqual([
      'skills/store-pattern/trigger-1',
    ]);
    expect(narrowed.costUsdReported).toBe(run.costUsdReported);
  });

  it('leaves a run that holds none of the named subjects with no task', () => {
    expect(narrowRun({ run, subjects: ['unslop'] }).tasks).toEqual([]);
  });
});
