import type { RunCost } from './EvalsCost.types';

import { costLabel } from '../utils/costLabel.util';
import { durationLabel } from '../utils/durationLabel.util';
import { evalsHref } from '../utils/evalsHref.util';

type CostChartPointsArgs = {
  readonly metric: 'computed' | 'p95' | 'reported';
  readonly runs: readonly RunCost[];
};

const METRICS = {
  computed: {
    describe: (usd: number) => `${costLabel(usd)} computed from model prices`,
    trial: 'costliest',
    value: (run: RunCost) => run.computedUsd,
  },
  p95: {
    describe: (milliseconds: number) => `p95 ${durationLabel(milliseconds)}`,
    trial: 'slowest',
    value: (run: RunCost) => run.p95Ms,
  },
  reported: {
    describe: (usd: number) => `${costLabel(usd)} reported by the SDK`,
    trial: 'costliest',
    value: (run: RunCost) => run.reportedUsd,
  },
} as const;

export const costChartPoints = ({ metric, runs }: CostChartPointsArgs) => {
  const { describe, trial, value } = METRICS[metric];

  return runs
    .map((run) => ({ run, value: value(run) }))
    .filter(
      (entry): entry is { readonly run: RunCost; readonly value: number } =>
        entry.value !== undefined,
    )
    .toSorted(
      (left, right) =>
        left.run.startedAt.getTime() - right.run.startedAt.getTime(),
    )
    .map(({ run, value: figure }) => {
      const trialId =
        trial === 'slowest' ? run.slowestTrialId : run.costliestTrialId;

      return {
        href: evalsHref({ runId: run.runId, trialId }),
        key: run.runId,
        label: `Run ${run.runId.slice(0, 8)}, ${run.startedAt.toISOString().slice(0, 10)}: ${describe(figure)}; open the ${trial} trial, ${trialId}`,
        value: figure,
      };
    });
};
