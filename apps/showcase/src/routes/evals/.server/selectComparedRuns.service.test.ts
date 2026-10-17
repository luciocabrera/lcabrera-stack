import type { RunSummary } from '@repo/eval-history/queries/queries.types';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectRunSummaries } from './evalsHistory.service';
import { selectComparedRuns } from './selectComparedRuns.service';

vi.mock('./evalsHistory.service', () => ({
  selectRunSummaries: vi.fn(),
}));

const run = (overrides: Partial<RunSummary>) =>
  ({
    branch: 'main',
    runId: 'run',
    startedAt: new Date('2026-10-01T02:00:00Z'),
    suite: 'skills',
    ...overrides,
  }) as RunSummary;

const answer = (runsFor: (scope: unknown) => readonly RunSummary[]) => {
  vi.mocked(selectRunSummaries).mockImplementation(({ scope }) =>
    Promise.resolve([...runsFor(scope)]),
  );
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('selectComparedRuns', () => {
  it('reads the two named runs', async () => {
    answer((scope) => [run({ runId: (scope as { runId: string }).runId })]);

    const pair = await selectComparedRuns({ a: 'x', b: 'y', kind: 'runs' });

    expect([pair?.a.runId, pair?.b.runId]).toEqual(['x', 'y']);
  });

  it('finds nothing when a named run is missing', async () => {
    answer((scope) =>
      (scope as { runId: string }).runId === 'x' ? [run({})] : [],
    );

    expect(
      await selectComparedRuns({ a: 'x', b: 'y', kind: 'runs' }),
    ).toBeUndefined();
  });

  it('sets the newest branch run against the newest other main run of its suite', async () => {
    answer((scope) =>
      (scope as { branch: string }).branch === 'main'
        ? [
            run({ runId: 'main-new', suite: 'skill-quality' }),
            run({ runId: 'main-skills' }),
          ]
        : [
            run({ branch: 'feat/x', runId: 'old', suite: 'skill-quality' }),
            run({
              branch: 'feat/x',
              runId: 'new',
              startedAt: new Date('2026-10-02T02:00:00Z'),
            }),
          ],
    );

    const pair = await selectComparedRuns({
      branch: 'feat/x',
      kind: 'branch',
      suite: undefined,
    });

    expect([pair?.a.runId, pair?.b.runId]).toEqual(['main-skills', 'new']);
    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { branch: 'feat/x', kind: 'recent', perSuite: 1 },
    });
  });

  it('compares main with its own previous run', async () => {
    answer(() => [run({ runId: 'latest' }), run({ runId: 'previous' })]);

    const pair = await selectComparedRuns({
      branch: 'main',
      kind: 'branch',
      suite: 'skills',
    });

    expect([pair?.a.runId, pair?.b.runId]).toEqual(['previous', 'latest']);
  });
});
