import type { RunTrial } from '@repo/eval-history/queries/queries.types';

type ToTrialPageArgs = {
  readonly data: readonly RunTrial[];
  readonly total: number;
};

export const toTrialPage = ({ data, total }: ToTrialPageArgs) => ({
  data: data.map((trial) => ({
    ...trial,
    invoked: trial.invoked?.join(', '),
  })),
  total,
});
