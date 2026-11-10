import type { AccuracyViewRow } from './EvalsAdjudications.types';

import { accuracyIntervalLabel } from './accuracyIntervalLabel.util';
import { accuracyLabel } from './accuracyLabel.util';

export const accuracyRows = (rows: readonly AccuracyViewRow[]) =>
  rows.map(
    ({ correct, falseAlarms, missedReal, model, verdicts, verifierRole }) => {
      const tally = { correct, scored: verdicts };

      return {
        accuracy: accuracyLabel(tally),
        correct,
        falseAlarms,
        id: `${model}/${verifierRole}`,
        interval: accuracyIntervalLabel(tally),
        missedReal,
        model,
        role: verifierRole,
        verdicts,
      };
    },
  );
