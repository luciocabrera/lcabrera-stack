import type { RunSummary } from '@repo/eval-history/queries/queries.types';

export const runSummary = (overrides: Partial<RunSummary>) =>
  ({
    branch: 'main',
    finishedAt: new Date('2026-10-01T02:40:00Z'),
    gitDirty: false,
    gitSha: 'a'.repeat(40),
    harnessVersion: 'abcdefabcdef',
    k: 3,
    modelId: 'model-a',
    n: 3,
    runId: '00000000-0000-4000-8000-00000000000a',
    startedAt: new Date('2026-10-01T02:00:00Z'),
    status: 'complete',
    suite: 'skills',
    trials: 3,
    trigger: 'ci-scheduled',
    ...overrides,
  }) as RunSummary;
