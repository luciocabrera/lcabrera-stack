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

type ReaderArgs<TRead extends (args: never) => unknown> = Omit<
  Parameters<TRead>[0],
  'client'
>;

export const selectAnnotations = (args: ReaderArgs<typeof readAnnotations>) =>
  readAnnotations({ ...args, client: evalsReaderPool() });

export const selectFlakyTasks = (args: ReaderArgs<typeof readFlakyTasks>) =>
  readFlakyTasks({ ...args, client: evalsReaderPool() });

export const selectQualityBaselines = () =>
  readQualityBaselines({ client: evalsReaderPool() });

export const selectQualityScores = (
  args: ReaderArgs<typeof readQualityScores>,
) => readQualityScores({ ...args, client: evalsReaderPool() });

export const selectReportRun = (args: ReaderArgs<typeof readReportRun>) =>
  readReportRun({ ...args, client: evalsReaderPool() });

export const selectRuleHistory = (args: ReaderArgs<typeof readRuleHistory>) =>
  readRuleHistory({ ...args, client: evalsReaderPool() });

export const selectRunComparison = (
  args: ReaderArgs<typeof readRunComparison>,
) => readRunComparison({ ...args, client: evalsReaderPool() });

export const selectRunCosts = (args: ReaderArgs<typeof readRunCosts>) =>
  readRunCosts({ ...args, client: evalsReaderPool() });

export const selectRunHealth = (args: ReaderArgs<typeof readRunHealth>) =>
  readRunHealth({ ...args, client: evalsReaderPool() });

export const selectRunJudgeScores = (
  args: ReaderArgs<typeof readRunJudgeScores>,
) => readRunJudgeScores({ ...args, client: evalsReaderPool() });

export const selectRunSummaries = (args: ReaderArgs<typeof readRunSummaries>) =>
  readRunSummaries({ ...args, client: evalsReaderPool() });

export const selectRunTrials = (args: ReaderArgs<typeof readRunTrials>) =>
  readRunTrials({ ...args, client: evalsReaderPool() });

export const selectSubjectRuns = (args: ReaderArgs<typeof readSubjectRuns>) =>
  readSubjectRuns({ ...args, client: evalsReaderPool() });

export const selectTaskTrials = (args: ReaderArgs<typeof readTaskTrials>) =>
  readTaskTrials({ ...args, client: evalsReaderPool() });

export const selectTriggerConfusion = (
  args: ReaderArgs<typeof readTriggerConfusion>,
) => readTriggerConfusion({ ...args, client: evalsReaderPool() });
