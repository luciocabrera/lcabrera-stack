import { describe, expect, it } from 'vite-plus/test';

import { reportRunFixture } from './reportRunFixture.util.ts';
import { sharedTaskRun } from './sharedTaskRun.util.ts';

const task = (taskKey: string) => ({
  outcomes: ['pass' as const],
  taskHash: `hash-${taskKey}`,
  taskKey,
});

describe('sharedTaskRun', () => {
  it('keeps only the tasks the other run holds too', () => {
    const run = reportRunFixture({ tasks: [task('a'), task('b')] });

    expect(
      sharedTaskRun({ other: { tasks: [task('b'), task('c')] }, run }).tasks,
    ).toEqual([task('b')]);
  });
});
