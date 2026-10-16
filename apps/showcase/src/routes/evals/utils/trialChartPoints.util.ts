import type { RunTrial } from '@repo/eval-history/queries/queries.types';

import type { SparklineTone } from '../Sparkline/Sparkline.types';

import { durationLabel } from './durationLabel.util';
import { evalsHref } from './evalsHref.util';

type TrialChartPointsArgs = {
  readonly runId: string;
  readonly trials: readonly RunTrial[];
};

const TONES: Readonly<Partial<Record<RunTrial['outcome'], SparklineTone>>> = {
  fail: 'error',
  pass: 'success',
};

export const trialChartPoints = ({ runId, trials }: TrialChartPointsArgs) =>
  trials.map((trial) => ({
    href: evalsHref({ runId, trialId: trial.trialId }),
    key: trial.trialId,
    label: `${trial.taskKey} trial ${String(trial.trialIndex)}: ${trial.outcome}, ${trial.durationMs === undefined ? 'no duration' : durationLabel(trial.durationMs)}`,
    tone: TONES[trial.outcome] ?? 'neutral',
    value: trial.durationMs ?? 0,
  }));
