import { evalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { readAnnotations } from '@repo/eval-history/queries/readAnnotations.service';
import { readFlakyTasks } from '@repo/eval-history/queries/readFlakyTasks.service';
import { readQualityBaselines } from '@repo/eval-history/queries/readQualityBaselines.service';
import { readQualityScores } from '@repo/eval-history/queries/readQualityScores.service';
import { readRunComparison } from '@repo/eval-history/queries/readRunComparison.service';
import { readRunCosts } from '@repo/eval-history/queries/readRunCosts.service';
import { readRunHealth } from '@repo/eval-history/queries/readRunHealth.service';
import { readRunJudgeScores } from '@repo/eval-history/queries/readRunJudgeScores.service';
import { readRunSummaries } from '@repo/eval-history/queries/readRunSummaries.service';
import { readRunTrials } from '@repo/eval-history/queries/readRunTrials.service';
import { readSubjectRuns } from '@repo/eval-history/queries/readSubjectRuns.service';
import { readTaskTrials } from '@repo/eval-history/queries/readTaskTrials.service';
import { readTriggerConfusion } from '@repo/eval-history/queries/readTriggerConfusion.service';
import { readReportRun } from '@repo/eval-history/report/readReportRun.service';
import { readRuleHistory } from '@repo/eval-history/report/readRuleHistory.service';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { EVALS_REGRESSION } from '../constants/evalsDashboard.constants';
import {
  selectAnnotations,
  selectFlakyTasks,
  selectQualityBaselines,
  selectQualityScores,
  selectReportRun,
  selectRuleHistory,
  selectRunComparison,
  selectRunCosts,
  selectRunHealth,
  selectRunJudgeScores,
  selectRunSummaries,
  selectRunTrials,
  selectSubjectRuns,
  selectTaskTrials,
  selectTriggerConfusion,
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

vi.mock('@repo/eval-history/queries/readRunJudgeScores.service', () => ({
  readRunJudgeScores: vi.fn(() => Promise.resolve([])),
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

vi.mock('@repo/eval-history/queries/readQualityBaselines.service', () => ({
  readQualityBaselines: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readQualityScores.service', () => ({
  readQualityScores: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readRunHealth.service', () => ({
  readRunHealth: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readTaskTrials.service', () => ({
  readTaskTrials: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/queries/readTriggerConfusion.service', () => ({
  readTriggerConfusion: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@repo/eval-history/report/readReportRun.service', () => ({
  readReportRun: vi.fn(() => Promise.resolve()),
}));

vi.mock('@repo/eval-history/report/readRuleHistory.service', () => ({
  readRuleHistory: vi.fn(() => Promise.resolve({ kind: 'needs-database' })),
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
      selectRunJudgeScores({ runId: 'run' }),
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
    expect(readRunJudgeScores).toHaveBeenCalledWith({
      client: POOL,
      runId: 'run',
    });
    expect(readSubjectRuns).toHaveBeenCalledWith({ client: POOL, scope });
    expect(evalsReaderPool).toHaveBeenCalledTimes(6);
  });

  it('reads the flaky, confusion, quality and health views on the reader pool', async () => {
    const runIds = ['run'];

    await Promise.all([
      selectQualityBaselines(),
      selectQualityScores({ runIds }),
      selectRunHealth({ runIds }),
      selectTaskTrials({ runIds, taskKeys: ['task'] }),
      selectTriggerConfusion({ runIds }),
    ]);

    expect(readQualityBaselines).toHaveBeenCalledWith({ client: POOL });
    expect(readQualityScores).toHaveBeenCalledWith({ client: POOL, runIds });
    expect(readRunHealth).toHaveBeenCalledWith({ client: POOL, runIds });
    expect(readTaskTrials).toHaveBeenCalledWith({
      client: POOL,
      runIds,
      taskKeys: ['task'],
    });
    expect(readTriggerConfusion).toHaveBeenCalledWith({ client: POOL, runIds });
    expect(evalsReaderPool).toHaveBeenCalledTimes(5);
  });

  it("reads the regression rule's runs and history on the reader pool", async () => {
    const run = { modelId: 'model-a', suite: 'skills' } as const;
    const config = EVALS_REGRESSION;

    await Promise.all([
      selectReportRun({ runId: 'run' }),
      selectRuleHistory({ config, excludedRuns: ['a', 'b'], run }),
    ]);

    expect(readReportRun).toHaveBeenCalledWith({ client: POOL, runId: 'run' });
    expect(readRuleHistory).toHaveBeenCalledWith({
      client: POOL,
      config,
      excludedRuns: ['a', 'b'],
      run,
    });
  });
});
