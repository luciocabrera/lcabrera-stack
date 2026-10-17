import type { CostFigures } from '@repo/eval-history/queries/queries.types';

import { costCoverageLabel } from '../utils/costCoverageLabel.util';
import { durationLabel } from '../utils/durationLabel.util';

const COUNT = new Intl.NumberFormat('en-US');

export const costFigureCells = (figures: CostFigures) => ({
  computed: costCoverageLabel({
    covered: figures.computedTrials,
    missing: 'no model price',
    trials: figures.trials,
    usd: figures.computedUsd,
    verb: 'priced',
  }),
  p50:
    figures.p50Ms === undefined ? 'no duration' : durationLabel(figures.p50Ms),
  p95:
    figures.p95Ms === undefined ? 'no duration' : durationLabel(figures.p95Ms),
  reported: costCoverageLabel({
    covered: figures.reportedTrials,
    missing: 'not reported',
    trials: figures.trials,
    usd: figures.reportedUsd,
    verb: 'reported',
  }),
  tokensCache: `${COUNT.format(figures.tokensCacheRead)} read, ${COUNT.format(figures.tokensCacheWrite)} written`,
  tokensIn: COUNT.format(figures.tokensIn),
  tokensOut: COUNT.format(figures.tokensOut),
  trials: COUNT.format(figures.trials),
});
