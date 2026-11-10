import type { TrendSparklineTone } from '@lcabrera/ui/components/TrendSparkline';
import type { RunTrial } from '@repo/eval-history/queries/queries.types';

import { durationLabel } from './durationLabel.util';
import { evalsHref } from './evalsHref.util';

type TrialChartPointsArgs = {
  readonly runId: string;
  readonly trials: readonly RunTrial[];
};

const TONES: Readonly<
  Partial<Record<RunTrial['outcome'], TrendSparklineTone>>
> = {
  fail: 'error',
  pass: 'success',
};

export const trialChartPoints = ({ runId, trials }: TrialChartPointsArgs) =>
  trials.map((trial) => ({
    label: `${trial.taskKey} trial ${String(trial.trialIndex)}: ${trial.outcome}, ${trial.durationMs === undefined ? 'no duration' : durationLabel(trial.durationMs)}`,
    to: evalsHref({ runId, trialId: trial.trialId }),
    tone: TONES[trial.outcome] ?? 'neutral',
    value: trial.durationMs ?? 0,
  }));
