import type { RunFigures } from '../types/runFigures.types';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';
import { costLabel } from '../utils/costLabel.util';
import { durationLabel } from '../utils/durationLabel.util';
import { intervalLabel } from '../utils/intervalLabel.util';
import { passRateLabel } from '../utils/passRateLabel.util';
import { pointsLabel } from '../utils/pointsLabel.util';
import { signedChange } from './signedChange.util';

type CompareTotalsArgs = {
  readonly a: RunFigures;
  readonly b: RunFigures;
};

export const compareTotals = ({ a, b }: CompareTotalsArgs) => [
  {
    a: passRateLabel(a),
    b: passRateLabel(b),
    change: signedChange({
      after: b.rate,
      before: a.rate,
      format: pointsLabel,
    }),
    metric: 'Pass rate',
  },
  {
    a: intervalLabel(a),
    b: intervalLabel(b),
    change:
      b.upper !== undefined && a.lower !== undefined && b.upper < a.lower
        ? 'B is below A'
        : 'overlapping or too few trials',
    metric: 'Interval',
  },
  {
    a: String(a.trials),
    b: String(b.trials),
    change: signedChange({ after: b.trials, before: a.trials, format: String }),
    metric: 'Trials',
  },
  {
    a: costLabel(a.costUsd),
    b: costLabel(b.costUsd),
    change: signedChange({
      after: b.costUsd,
      before: a.costUsd,
      format: costLabel,
    }),
    metric: `Cost (${EVALS_COST_LABELS.reported})`,
  },
  {
    a: durationLabel(a.durationMs),
    b: durationLabel(b.durationMs),
    change: signedChange({
      after: b.durationMs,
      before: a.durationMs,
      format: durationLabel,
    }),
    metric: 'Duration',
  },
];
