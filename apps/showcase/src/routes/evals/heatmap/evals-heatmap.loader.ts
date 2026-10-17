import {
  selectFlakyTasks,
  selectSubjectRuns,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import {
  EVALS_FLAKY,
  EVALS_HEATMAP_RUNS,
} from '../constants/evalsDashboard.constants';
import { heatmapGrids } from './heatmapGrids.util';

export const loader = async () => {
  requireEvalsDashboard();

  const [cells, flaky] = await Promise.all([
    selectSubjectRuns({
      scope: { kind: 'recent', perSuite: EVALS_HEATMAP_RUNS },
    }),
    selectFlakyTasks(EVALS_FLAKY),
  ]);

  return {
    flaky: flaky.map(({ suite, taskKey }) => ({ suite, taskKey })),
    grids: heatmapGrids({ cells, flaky }),
  };
};
