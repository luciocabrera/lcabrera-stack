import type { RunTrial } from '@repo/eval-history/queries/queries.types';

import { costLabel } from './costLabel.util';
import { durationLabel } from './durationLabel.util';

export const trialSummaryLabel = (trial: RunTrial) => {
  const outcome =
    trial.errorClass === undefined
      ? trial.outcome
      : `${trial.outcome} (${trial.errorClass})`;
  const duration =
    trial.durationMs === undefined
      ? 'no duration'
      : durationLabel(trial.durationMs);
  const turns =
    trial.turns === undefined
      ? 'turns unknown'
      : `${String(trial.turns)} turns`;

  return `Trial ${trial.trialId}: ${trial.taskKey} trial ${String(trial.trialIndex)}, ${outcome}, ${duration}, ${turns}, ${costLabel(trial.costUsd)}.`;
};
