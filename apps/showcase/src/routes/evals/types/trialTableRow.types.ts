import type { RunTrial } from '@repo/eval-history/queries/queries.types';

export type TrialPage = {
  readonly data: readonly TrialTableRow[];
  readonly total: number;
};

export type TrialTableRow = Omit<RunTrial, 'invoked'> & {
  readonly invoked: string | undefined;
};
