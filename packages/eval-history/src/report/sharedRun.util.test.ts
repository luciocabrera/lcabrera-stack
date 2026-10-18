import { describe, expect, it } from 'vite-plus/test';

import {
  reportRunFixture,
  reportTaskFixture,
} from './reportRunFixture.util.ts';
import { sharedRun } from './sharedRun.util.ts';

const task = (taskKey: string) =>
  reportTaskFixture({
    outcomes: ['pass'],
    taskHash: `hash-${taskKey}`,
    taskKey,
  });

const subject = (name: string) => ({
  contentHash: `content-${name}`,
  kind: 'skill',
  name,
});

describe('sharedRun', () => {
  it('keeps only the tasks the other run holds too', () => {
    const run = reportRunFixture({ tasks: [task('a'), task('b')] });

    expect(
      sharedRun({
        other: { subjects: run.subjects, tasks: [task('b'), task('c')] },
        run,
      }).tasks,
    ).toEqual([task('b')]);
  });

  it('keeps only the subjects the other run holds too, by kind and name', () => {
    const run = reportRunFixture({
      subjects: [subject('react-19'), subject('store-pattern')],
    });

    expect(
      sharedRun({
        other: {
          subjects: [
            { ...subject('react-19'), contentHash: 'edited' },
            { ...subject('store-pattern'), kind: 'rule' },
          ],
          tasks: run.tasks,
        },
        run,
      }).subjects,
    ).toEqual([subject('react-19')]);
  });
});
