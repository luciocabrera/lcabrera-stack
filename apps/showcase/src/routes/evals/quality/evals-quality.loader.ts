import {
  selectQualityBaselines,
  selectQualityScores,
  selectRunSummaries,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_QUALITY_RUNS } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { QUALITY_SUITE } from './EvalsQuality.constants';
import { qualitySkills } from './qualitySkills.util';

export const loader = async () => {
  requireEvalsDashboard();

  const [recent, baselines] = await Promise.all([
    selectRunSummaries({
      scope: { kind: 'recent', perSuite: EVALS_QUALITY_RUNS },
    }),
    selectQualityBaselines(),
  ]);
  const runs = recent
    .filter(({ suite }) => suite === QUALITY_SUITE)
    .map((run) => runFigures(run));
  const scores = await selectQualityScores({
    runIds: [
      ...new Set([
        ...runs.map(({ runId }) => runId),
        ...baselines.flatMap(({ runIds }) => runIds),
      ]),
    ],
  });

  return {
    runs: runs.map(({ runId }) => runId),
    skills: qualitySkills({ baselines, runs, scores }),
  };
};
