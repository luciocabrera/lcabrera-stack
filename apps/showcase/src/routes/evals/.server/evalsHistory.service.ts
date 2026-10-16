import { evalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { readAnnotations } from '@repo/eval-history/queries/readAnnotations.service';
import { readFlakyTasks } from '@repo/eval-history/queries/readFlakyTasks.service';
import { readRunComparison } from '@repo/eval-history/queries/readRunComparison.service';
import { readRunCosts } from '@repo/eval-history/queries/readRunCosts.service';
import { readRunSummaries } from '@repo/eval-history/queries/readRunSummaries.service';
import { readRunTrials } from '@repo/eval-history/queries/readRunTrials.service';
import { readSubjectRuns } from '@repo/eval-history/queries/readSubjectRuns.service';

type ReaderArgs<TRead extends (args: never) => unknown> = Omit<
  Parameters<TRead>[0],
  'client'
>;

export const selectAnnotations = (args: ReaderArgs<typeof readAnnotations>) =>
  readAnnotations({ ...args, client: evalsReaderPool() });

export const selectFlakyTasks = (args: ReaderArgs<typeof readFlakyTasks>) =>
  readFlakyTasks({ ...args, client: evalsReaderPool() });

export const selectRunComparison = (
  args: ReaderArgs<typeof readRunComparison>,
) => readRunComparison({ ...args, client: evalsReaderPool() });

export const selectRunCosts = (args: ReaderArgs<typeof readRunCosts>) =>
  readRunCosts({ ...args, client: evalsReaderPool() });

export const selectRunSummaries = (args: ReaderArgs<typeof readRunSummaries>) =>
  readRunSummaries({ ...args, client: evalsReaderPool() });

export const selectRunTrials = (args: ReaderArgs<typeof readRunTrials>) =>
  readRunTrials({ ...args, client: evalsReaderPool() });

export const selectSubjectRuns = (args: ReaderArgs<typeof readSubjectRuns>) =>
  readSubjectRuns({ ...args, client: evalsReaderPool() });
