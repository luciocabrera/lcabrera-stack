import { describe, expect, it } from 'vite-plus/test';

import type { ReportRun, ReportTask } from './report.types.ts';

import { runHashes } from './runHashes.util.ts';

type TaskArgs = {
  readonly agentPromptHash: string;
  readonly taskKey: string;
};

const task = ({ agentPromptHash, taskKey }: TaskArgs): ReportTask => ({
  agentPromptHash,
  fixtureHash: `fixture-${taskKey}`,
  outcomes: ['pass'],
  taskHash: `task-${taskKey}`,
  taskKey,
});

const run: ReportRun = {
  branch: 'main',
  durationsMs: [],
  gitSha: 'a'.repeat(40),
  harnessVersion: 'h1',
  modelId: 'model-a',
  runId: 'run',
  status: 'complete',
  subjects: [{ contentHash: 'c1', kind: 'agent', name: 'refactor-verifier' }],
  suite: 'verifier-fixtures',
  tasks: [
    task({ agentPromptHash: 'p1', taskKey: 'f2' }),
    task({ agentPromptHash: 'p1', taskKey: 'f1' }),
  ],
};

describe('runHashes', () => {
  it('keys every input the run recorded, and leaves out what it did not', () => {
    expect(runHashes(run)).toEqual({
      'agent-prompt': 'p1',
      'content:agent/refactor-verifier': 'c1',
      'fixture:f1': 'fixture-f1',
      'fixture:f2': 'fixture-f2',
      harness: 'h1',
      model: 'model-a',
      'task:f1': 'task-f1',
      'task:f2': 'task-f2',
    });
  });

  it('records a prompt every task shares once, so editing it is one cause', () => {
    const edited = runHashes({
      ...run,
      tasks: [
        task({ agentPromptHash: 'p2', taskKey: 'f2' }),
        task({ agentPromptHash: 'p2', taskKey: 'f1' }),
      ],
    });

    expect(edited['agent-prompt']).toBe('p2');
  });

  it('keeps every distinct prompt hash when tasks disagree', () => {
    const mixed = runHashes({
      ...run,
      tasks: [
        task({ agentPromptHash: 'p2', taskKey: 'f2' }),
        task({ agentPromptHash: 'p1', taskKey: 'f1' }),
      ],
    });

    expect(mixed['agent-prompt']).toBe('p1,p2');
  });
});
