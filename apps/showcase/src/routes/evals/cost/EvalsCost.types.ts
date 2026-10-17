import type { readRunCosts } from '@repo/eval-history/queries/readRunCosts.service';

import type { loader } from './evals-cost.loader';

export type CostChartsProps = {
  readonly charts: Awaited<ReturnType<typeof loader>>['charts'];
};

export type RunCost = RunCosts['runs'][number];

type RunCosts = Awaited<ReturnType<typeof readRunCosts>>;
