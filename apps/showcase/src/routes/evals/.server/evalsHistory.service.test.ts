import { evalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { readRunSummaries } from '@repo/eval-history/queries/readRunSummaries.service';
import { readRunTrials } from '@repo/eval-history/queries/readRunTrials.service';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { selectRunSummaries, selectRunTrials } from './evalsHistory.service';

const POOL = { query: vi.fn() };

vi.mock('@repo/eval-history/queries/evalsReaderPool.service', () => ({
  evalsReaderPool: vi.fn(() => POOL),
}));

vi.mock('@repo/eval-history/queries/readRunSummaries.service', () => ({
  readRunSummaries: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readRunTrials.service', () => ({
  readRunTrials: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
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
});
