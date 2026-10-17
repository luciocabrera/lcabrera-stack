import { evalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { readAnnotations } from '@repo/eval-history/queries/readAnnotations.service';
import { readFlakyTasks } from '@repo/eval-history/queries/readFlakyTasks.service';
import { readRunComparison } from '@repo/eval-history/queries/readRunComparison.service';
import { readRunCosts } from '@repo/eval-history/queries/readRunCosts.service';
import { readRunSummaries } from '@repo/eval-history/queries/readRunSummaries.service';
import { readRunTrials } from '@repo/eval-history/queries/readRunTrials.service';
import { readSubjectRuns } from '@repo/eval-history/queries/readSubjectRuns.service';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  selectAnnotations,
  selectFlakyTasks,
  selectRunComparison,
  selectRunCosts,
  selectRunSummaries,
  selectRunTrials,
  selectSubjectRuns,
} from './evalsHistory.service';

const POOL = { query: vi.fn() };

vi.mock('@repo/eval-history/queries/evalsReaderPool.service', () => ({
  evalsReaderPool: vi.fn(() => POOL),
}));

vi.mock('@repo/eval-history/queries/readAnnotations.service', () => ({
  readAnnotations: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readFlakyTasks.service', () => ({
  readFlakyTasks: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readRunComparison.service', () => ({
  readRunComparison: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readRunCosts.service', () => ({
  readRunCosts: vi.fn(() =>
    Promise.resolve({ runs: [], subjects: [], suites: [] }),
  ),
}));

vi.mock('@repo/eval-history/queries/readRunSummaries.service', () => ({
  readRunSummaries: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readRunTrials.service', () => ({
  readRunTrials: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
}));

vi.mock('@repo/eval-history/queries/readSubjectRuns.service', () => ({
  readSubjectRuns: vi.fn(() => Promise.resolve([])),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('the evals history service', () => {
  it('reads run summaries on the reader pool', async () => {
    await selectRunSummaries({ scope: { kind: 'recent', perSuite: 30 } });

    expect(evalsReaderPool).toHaveBeenCalledOnce();
    expect(readRunSummaries).toHaveBeenCalledWith({
      client: POOL,
      scope: { kind: 'recent', perSuite: 30 },
    });
  });

  it('reads a page of trials on the reader pool', async () => {
    const page = { limit: 10, offset: 0, runId: 'run', sorting: [] };

    await selectRunTrials(page);

    expect(readRunTrials).toHaveBeenCalledWith({ ...page, client: POOL });
  });

  it('reads every other view on the reader pool', async () => {
    const range = { from: new Date(0), to: new Date(1) };
    const scope = { kind: 'recent', perSuite: 5 } as const;

    await Promise.all([
      selectAnnotations(range),
      selectFlakyTasks({ disagreeFraction: 0.2, window: 10 }),
      selectRunComparison({ a: 'a', b: 'b' }),
      selectRunCosts({ perSuite: 5 }),
      selectSubjectRuns({ scope }),
    ]);

    expect(readAnnotations).toHaveBeenCalledWith({ ...range, client: POOL });
    expect(readFlakyTasks).toHaveBeenCalledWith({
      client: POOL,
      disagreeFraction: 0.2,
      window: 10,
    });
    expect(readRunComparison).toHaveBeenCalledWith({
      a: 'a',
      b: 'b',
      client: POOL,
    });
    expect(readRunCosts).toHaveBeenCalledWith({ client: POOL, perSuite: 5 });
    expect(readSubjectRuns).toHaveBeenCalledWith({ client: POOL, scope });
    expect(evalsReaderPool).toHaveBeenCalledTimes(5);
  });
});
