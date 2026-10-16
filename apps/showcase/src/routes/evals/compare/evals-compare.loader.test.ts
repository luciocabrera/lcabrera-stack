import type { RunSummary } from '@repo/eval-history/queries/queries.types';
import type { LoaderFunctionArgs } from 'react-router';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import {
  selectRunComparison,
  selectRunSummaries,
} from '../.server/evalsHistory.service';
import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';
import { comparisonRow } from './comparisonRow.fixtures';
import { loader } from './evals-compare.loader';

vi.mock('../.server/evalsHistory.service', () => ({
  selectRunComparison: vi.fn(),
  selectRunSummaries: vi.fn(),
}));

const RUN_A = '00000000-0000-4000-8000-00000000000a';
const RUN_B = '00000000-0000-4000-8000-00000000000b';

const summary = (runId: string) =>
  ({
    branch: 'main',
    finishedAt: new Date('2026-10-01T02:40:00Z'),
    gitSha: 'a'.repeat(40),
    harnessVersion: 'abc',
    k: 3,
    n: 3,
    runId,
    startedAt: new Date('2026-10-01T02:00:00Z'),
    suite: 'skills',
    trials: 3,
  }) as RunSummary;

const invoke = (search: string) =>
  loader(
    routeLoaderArgs({
      params: {},
      path: 'evals/compare',
      search,
    }) as LoaderFunctionArgs,
  );

const statusOf = async (search: string) => {
  try {
    await invoke(search);

    return 'answered';
  } catch (error) {
    return error instanceof Response ? error.status : 'not a response';
  }
};

beforeEach(() => {
  vi.stubEnv('EVALS_DASHBOARD', '1');
  vi.mocked(selectRunSummaries).mockImplementation(({ scope }) =>
    Promise.resolve(scope.kind === 'run' ? [summary(scope.runId)] : []),
  );
  vi.mocked(selectRunComparison).mockResolvedValue([comparisonRow({ kB: 1 })]);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});

describe('the compare loader', () => {
  it('offers recent runs to choose from when none is named', async () => {
    const data = await invoke('');

    expect(data.comparison).toBeUndefined();
    expect(selectRunSummaries).toHaveBeenCalledWith({
      scope: { kind: 'recent', perSuite: 10 },
    });
  });

  it('answers 404 for a malformed pair, before any query', async () => {
    expect(await statusOf(`?a=${RUN_A}&b=nope`)).toBe(404);
    expect(selectRunSummaries).not.toHaveBeenCalled();
  });

  it('answers 404 when a named run does not exist', async () => {
    vi.mocked(selectRunSummaries).mockResolvedValue([]);

    expect(await statusOf(`?a=${RUN_A}&b=${RUN_B}`)).toBe(404);
  });

  it('compares the two runs it names, flips first', async () => {
    const { comparison } = await invoke(`?a=${RUN_A}&b=${RUN_B}`);

    expect(selectRunComparison).toHaveBeenCalledWith({ a: RUN_A, b: RUN_B });
    expect(comparison?.flips.map(({ change }) => change)).toEqual([
      'regressed',
    ]);
    expect(comparison?.changes).toEqual({ kind: 'none' });
    expect(comparison?.totals[0]?.metric).toBe('Pass rate');
  });
});
