import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { EnvelopeShape } from './envelope.types.ts';

import { envelopeShapeSchema } from './envelope.schema.ts';
import { qualityJudgeIssues } from './qualityJudgeIssues.util.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';

const fixturesDirectory = fileURLToPath(new URL('fixtures', import.meta.url));

const fixture = async (name: string): Promise<EnvelopeShape> => {
  const fixtures = await readJsonFiles({ directory: fixturesDirectory });

  return envelopeShapeSchema.parse(fixtures.get(name));
};

const firstTrialAndTask = async (name: string) => {
  const { tasks, trials } = await fixture(name);
  const [trial] = trials;
  const [task] = tasks;

  if (!trial || !task) {
    throw new Error(`the ${name} fixture has no trial or task`);
  }

  return { task, trial };
};

describe('qualityJudgeIssues', () => {
  it('finds nothing on a quality trial naming its judge and prompt hash', async () => {
    const { task, trial } = await firstTrialAndTask('skill-quality.json');

    expect(
      qualityJudgeIssues({ detail: trial.detail, index: 0, task }),
    ).toEqual([]);
  });

  it('flags a quality trial with a blank judge model or no prompt hash', async () => {
    const { task, trial } = await firstTrialAndTask('skill-quality.json');
    const { task: unjudgedTask } = await firstTrialAndTask('skills.json');

    if (trial.detail.schema !== 'quality/1') {
      throw new Error('the skill-quality fixture holds a quality trial');
    }

    expect(
      qualityJudgeIssues({
        detail: { ...trial.detail, judge_model: ' ' },
        index: 2,
        task: { ...unjudgedTask, kind: 'quality', task_key: task.task_key },
      }).map(({ message, path }) => [path.join('.'), message]),
    ).toEqual([
      ['trials.2.detail.judge_model', 'a quality trial names its judge_model'],
      [
        'trials.2.task_key',
        'quality task skill-quality/unslop carries no judge_prompt_hash',
      ],
    ]);
  });

  it('asks nothing of a trial from another suite', async () => {
    const { task, trial } = await firstTrialAndTask('skills.json');

    expect(task.judge_prompt_hash).toBeNull();

    expect(
      qualityJudgeIssues({
        detail: trial.detail,
        index: 0,
        task,
      }),
    ).toEqual([]);
  });
});
