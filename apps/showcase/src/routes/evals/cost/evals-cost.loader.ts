import { selectRunCosts } from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_COST_RUNS } from '../constants/evalsDashboard.constants';
import { evalsHref } from '../utils/evalsHref.util';
import { subjectHref } from '../utils/subjectHref.util';
import { costChartPoints } from './costChartPoints.util';
import { costFigureCells } from './costFigureCells.util';

export const loader = async () => {
  requireEvalsDashboard();

  const costs = await selectRunCosts({ perSuite: EVALS_COST_RUNS });

  return {
    charts: costs.suites.map(({ suite }) => {
      const runs = costs.runs.filter((run) => run.suite === suite);

      return {
        computed: costChartPoints({ metric: 'computed', runs }),
        p95: costChartPoints({ metric: 'p95', runs }),
        reported: costChartPoints({ metric: 'reported', runs }),
        suite,
      };
    }),
    runs: costs.runs.map((run) => ({
      cells: costFigureCells(run),
      href: evalsHref({ runId: run.runId }),
      id: run.runId,
      label: `${run.suite}, ${run.startedAt.toISOString().slice(0, 16).replace('T', ' ')}, ${run.modelId ?? 'no model'}`,
    })),
    subjects: costs.subjects.map((subject) => ({
      cells: costFigureCells(subject),
      href: subjectHref({
        kind: subject.subjectKind,
        name: subject.subjectName,
      }),
      id: `${subject.subjectKind}/${subject.subjectName}`,
      label: `${subject.subjectKind} ${subject.subjectName}`,
    })),
    suites: costs.suites.map((suite) => ({
      cells: costFigureCells(suite),
      id: suite.suite,
      label: suite.suite,
    })),
  };
};
