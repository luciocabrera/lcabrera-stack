import type { RunSummary } from '@repo/eval-history/queries/queries.types';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { selectRunSummaries } from './evalsHistory.service';
import { requireStoredRun } from './requireStoredRun.service';

vi.mock('./evalsHistory.service', () => ({
  selectRunSummaries: vi.fn(),
}));

const RUN_ID = '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50';

const run = { runId: RUN_ID } as RunSummary;

const outcomeOf = async (runId: string | undefined) => {
  try {
    return await requireStoredRun(runId);
  } catch (error) {
    return error instanceof Response ? error.status : 'not a response';
  }
};

beforeEach(() => {
  vi.stubEnv('EVALS_DASHBOARD', '1');
  vi.mocked(selectRunSummaries).mockResolvedValue([run]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(selectRunSummaries).mockReset();
});

describe('requireStoredRun', () => {
  it('returns the stored run the id names', async () => {
    expect(await outcomeOf(RUN_ID)).toBe(run);
    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'run', runId: RUN_ID },
    });
  });

  it('answers 404 with the flag unset, before any read', async () => {
    vi.stubEnv('EVALS_DASHBOARD', '');

    expect(await outcomeOf(RUN_ID)).toBe(404);
    expect(selectRunSummaries).not.toHaveBeenCalled();
  });

  it.each([undefined, 'not-a-run'])(
    'answers 404 for run id %j, before any read',
    async (runId) => {
      expect(await outcomeOf(runId)).toBe(404);
      expect(selectRunSummaries).not.toHaveBeenCalled();
    },
  );

  it('answers 404 for a run that is not stored', async () => {
    vi.mocked(selectRunSummaries).mockResolvedValue([]);

    expect(await outcomeOf(RUN_ID)).toBe(404);
  });
});
