import type { Suite } from './report.types.ts';

import { BASELINE_METRIC_BY_SUITE } from '../baseline/baseline.constants.ts';
import { isBaselineSuite } from '../baseline/isBaselineSuite.util.ts';

export const isScoredSuite = (suite: Suite) =>
  isBaselineSuite(suite) &&
  BASELINE_METRIC_BY_SUITE[suite] === 'quality_overall';
