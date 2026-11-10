import type { RunTrial } from '@repo/eval-history/queries/queries.types';

export type SelectedTrialProps = {
  readonly runId: string;
  readonly trial: RunTrial;
};
