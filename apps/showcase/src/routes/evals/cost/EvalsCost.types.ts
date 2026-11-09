import type { readRunCosts } from '@repo/eval-history/queries/readRunCosts.service';

import type { costFigureCells } from './costFigureCells.util';
import type { loader } from './evals-cost.loader';

export type CostChartsProps = {
  readonly charts: Awaited<ReturnType<typeof loader>>['charts'];
};

export type CostRow = ReturnType<typeof costFigureCells> & {
  readonly href?: string;
  readonly name: string;
};

export type CostTableProps = {
  readonly caption: string;
  readonly density: 'compact' | 'dense';
  readonly rows: readonly CostRow[];
};

export type RunCost = RunCosts['runs'][number];

type RunCosts = Awaited<ReturnType<typeof readRunCosts>>;
