import { evalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { readRunSummaries } from '@repo/eval-history/queries/readRunSummaries.service';
import { readRunTrials } from '@repo/eval-history/queries/readRunTrials.service';

type RunSummariesArgs = Omit<Parameters<typeof readRunSummaries>[0], 'client'>;

type RunTrialsArgs = Omit<Parameters<typeof readRunTrials>[0], 'client'>;

export const selectRunSummaries = (args: RunSummariesArgs) =>
  readRunSummaries({ ...args, client: evalsReaderPool() });

export const selectRunTrials = (args: RunTrialsArgs) =>
  readRunTrials({ ...args, client: evalsReaderPool() });
