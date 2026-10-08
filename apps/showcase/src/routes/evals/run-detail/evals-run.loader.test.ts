import type {
  RunSummary,
  RunTrial,
} from '@repo/eval-history/queries/queries.types';
import type { LoaderFunctionArgs } from 'react-router';

import { readRunSummaries } from '@repo/eval-history/queries/readRunSummaries.service';
import { readRunTrials } from '@repo/eval-history/queries/readRunTrials.service';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';
import { loader } from './evals-run.loader';

vi.mock('@repo/eval-history/queries/evalsReaderPool.service', () => ({
  evalsReaderPool: () => ({ query: vi.fn() }),
}));

vi.mock('@repo/eval-history/queries/readRunSummaries.service', () => ({
  readRunSummaries: vi.fn(),
}));

vi.mock('@repo/eval-history/queries/readRunTrials.service', () => ({
  readRunTrials: vi.fn(),
}));

const RUN_ID = '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50';

const run = {
  branch: 'main',
  finishedAt: new Date('2026-10-01T02:40:00.000Z'),
  gitSha: 'a'.repeat(40),
  harnessVersion: 'abcdefabcdef',
  k: 8,
  n: 10,
  runId: RUN_ID,
  startedAt: new Date('2026-10-01T02:00:00.000Z'),
  status: 'complete',
  suite: 'skills',
  trials: 12,
  trigger: 'ci-scheduled',
} as RunSummary;

const trial = {
  durationMs: 12_000,
  outcome: 'pass',
  taskKey: 'skills/react-19/trigger-1',
  trialId: '7',
  trialIndex: 0,
} as RunTrial;

const invoke = (path: string) => {
  const url = new URL(`http://localhost${path}`);

  return loader(
    routeLoaderArgs({
      params: { runId: url.pathname.split('/').at(-1) ?? '' },
      path: 'evals/runs/:runId',
      search: url.search,
    }) as LoaderFunctionArgs,
  );
};

const statusOf = async (path: string) => {
  try {
    await invoke(path);

    return 'answered';
  } catch (error) {
    return error instanceof Response ? error.status : 'not a response';
  }
};

beforeEach(() => {
  vi.stubEnv('EVALS_DASHBOARD', '1');
  vi.mocked(readRunSummaries).mockResolvedValue([run]);
  vi.mocked(readRunTrials).mockResolvedValue({ data: [trial], total: 1 });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(readRunSummaries).mockReset();
  vi.mocked(readRunTrials).mockReset();
});

describe('the run page loader', () => {
  it('answers 404 for a run id that is not a uuid, before any read', async () => {
    expect(await statusOf('/evals/runs/not-a-run')).toBe(404);
    expect(readRunSummaries).not.toHaveBeenCalled();
  });

  it('answers 404 for a run that is not stored', async () => {
    vi.mocked(readRunSummaries).mockResolvedValue([]);

    expect(await statusOf(`/evals/runs/${RUN_ID}`)).toBe(404);
  });

  it('returns the run figures and one linked chart point per trial', async () => {
    const data = await invoke(`/evals/runs/${RUN_ID}`);

    expect(data.run).toMatchObject({ rate: 0.8, runId: RUN_ID });
    expect(data.chart.map(({ href }) => href)).toEqual([
      `/evals/runs/${RUN_ID}?trial=7`,
    ]);
    expect(data.selectedTrial).toBeUndefined();
  });

  it('reads the trial a chart point links to', async () => {
    const data = await invoke(`/evals/runs/${RUN_ID}?trial=7`);

    expect(data.selectedTrial).toEqual(trial);
    expect(readRunTrials).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1, runId: RUN_ID, trialId: '7' }),
    );
  });

  it('ignores a trial parameter that is not a trial id', async () => {
    await invoke(`/evals/runs/${RUN_ID}?trial=1;drop`);

    expect(readRunTrials).not.toHaveBeenCalledWith(
      expect.objectContaining({ trialId: expect.anything() }),
    );
  });

  it('pages the table in the order the URL asks for', async () => {
    const data = await invoke(
      `/evals/runs/${RUN_ID}?sorting=${encodeURIComponent(JSON.stringify({ durationMs: 'desc' }))}`,
    );

    await data.dataPromise;

    expect(readRunTrials).toHaveBeenCalledWith(
      expect.objectContaining({
        sorting: expect.arrayContaining([
          { column: 'durationMs', direction: 'desc' },
        ]),
      }),
    );
  });
});
