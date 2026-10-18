import type {
  RunSummary,
  RunTrial,
} from '@repo/eval-history/queries/queries.types';
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
  selectRunJudgeScores,
  selectRunTrials,
} from '../.server/evalsHistory.service';
import { requireStoredRun } from '../.server/requireStoredRun.service';
import { routeLoaderArgs } from '../utils/routeLoaderArgs.util';
import { loader } from './evals-run-json.loader';

vi.mock('../.server/evalsHistory.service', () => ({
  selectRunJudgeScores: vi.fn(),
  selectRunTrials: vi.fn(),
}));

vi.mock('../.server/requireStoredRun.service', () => ({
  requireStoredRun: vi.fn(),
}));

const RUN_ID = '6f1d4c4e-8a4f-4b8c-9a0e-0c1f2d3e4f50';

const run = {
  branch: 'main',
  finishedAt: new Date('2026-10-01T02:40:00.000Z'),
  gitSha: 'a'.repeat(40),
  modelId: 'claude-test',
  runId: RUN_ID,
  startedAt: new Date('2026-10-01T02:00:00.000Z'),
  status: 'complete',
  suite: 'skill-quality',
  trials: 3,
  trigger: 'manual',
} as RunSummary;

const trial = {
  outcome: 'pass',
  overall: 4,
  subjectKind: 'skill',
  subjectName: 'unslop',
  taskKey: 'skill-quality/unslop',
  taskKind: 'quality',
  trialId: '7',
  trialIndex: 0,
} as RunTrial;

const invoke = (runId: string) =>
  loader(
    routeLoaderArgs({
      params: { runId },
      path: 'evals/runs/:runId.json',
      search: '',
    }) as LoaderFunctionArgs,
  );

beforeEach(() => {
  vi.mocked(requireStoredRun).mockResolvedValue(run);
  vi.mocked(selectRunTrials).mockResolvedValue({ data: [trial], total: 1 });
  vi.mocked(selectRunJudgeScores).mockResolvedValue([
    { dimension: 'clarity', score: 4, trialId: '7' },
  ]);
});

afterEach(() => {
  vi.mocked(requireStoredRun).mockReset();
  vi.mocked(selectRunJudgeScores).mockReset();
  vi.mocked(selectRunTrials).mockReset();
});

describe('the stored run JSON loader', () => {
  it('answers what requireStoredRun refuses, before reading any trial', async () => {
    vi.mocked(requireStoredRun).mockRejectedValue(
      new Response('Not Found', { status: 404 }),
    );

    await expect(invoke('not-a-run')).rejects.toHaveProperty('status', 404);
    expect(requireStoredRun).toHaveBeenCalledWith('not-a-run');
    expect(selectRunTrials).not.toHaveBeenCalled();
  });

  it('answers the run projection as JSON any origin may read', async () => {
    const response = await invoke(RUN_ID);

    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(await response.json()).toMatchObject({
      run: { model_id: 'claude-test', run_id: RUN_ID },
      tasks: [{ subject: { kind: 'skill', name: 'unslop' } }],
      trials: [
        {
          detail: { dimensions: [{ name: 'clarity', score: 4 }], overall: 4 },
          task_key: 'skill-quality/unslop',
        },
      ],
    });
  });

  it('reads every stored trial of the run, not one page', async () => {
    await invoke(RUN_ID);

    expect(selectRunTrials).toHaveBeenCalledWith({
      limit: 3,
      offset: 0,
      runId: RUN_ID,
      sorting: [],
    });
    expect(selectRunJudgeScores).toHaveBeenCalledWith({ runId: RUN_ID });
  });
});
