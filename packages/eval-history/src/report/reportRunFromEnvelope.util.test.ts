import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';
import { fixtureEnvelope } from './fixtureEnvelope.util.ts';
import { reportRunFromEnvelope } from './reportRunFromEnvelope.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const base: RunEnvelope = runEnvelopeSchema.parse(fixtures.get('skills.json'));

const aborted = fixtureEnvelope({
  base,
  outcomes: {
    'skills/react-19/trigger-1': ['pass', 'pass'],
    'skills/react-19/trigger-2': ['fail'],
    'skills/react-19/trigger-3': [],
  },
  runId: '00000000-0000-4000-8000-0000000000c1',
});

const unrun = { kind: 'skill', name: 'store-pattern' } as const;

const withUnrunSubject: RunEnvelope = {
  ...aborted,
  subjects: [
    ...aborted.subjects,
    {
      content_hash: sha256Hex('store-pattern'),
      kind: unrun.kind,
      name: unrun.name,
      path: '.github/skills/store-pattern/SKILL.md',
    },
  ],
  tasks: [
    ...aborted.tasks,
    ...aborted.tasks.slice(0, 1).map((task) => ({
      ...task,
      subject: unrun,
      task_hash: sha256Hex('store-pattern/trigger-1'),
      task_key: 'skills/store-pattern/trigger-1',
    })),
  ],
};

describe('reportRunFromEnvelope', () => {
  it('reads only the tasks that have trials, as the database does', () => {
    const { tasks } = reportRunFromEnvelope(aborted);

    expect(tasks.map(({ outcomes, taskKey }) => [taskKey, outcomes])).toEqual([
      ['skills/react-19/trigger-1', ['pass', 'pass']],
      ['skills/react-19/trigger-2', ['fail']],
    ]);
  });

  it('reads only the subjects a trialled task names', () => {
    const { subjects, tasks } = reportRunFromEnvelope(withUnrunSubject);

    expect(subjects.map(({ name }) => name)).toEqual(['react-19']);
    expect(tasks.map(({ taskKey }) => taskKey)).not.toContain(
      'skills/store-pattern/trigger-1',
    );
  });
});
