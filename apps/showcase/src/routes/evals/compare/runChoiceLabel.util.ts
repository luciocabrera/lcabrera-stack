import type { RunFigures } from '../types/runFigures.types';

import { passRateLabel } from '../utils/passRateLabel.util';

export const runChoiceLabel = (run: RunFigures) =>
  `${run.suite}, ${run.startedAt.slice(0, 16).replace('T', ' ')} on ${run.branch}: ${passRateLabel(run)}`;
