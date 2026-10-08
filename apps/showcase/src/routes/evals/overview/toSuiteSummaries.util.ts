import type { RunFigures } from '../types/runFigures.types';
import type { SuiteSummary } from './EvalsOverview.types';

import { evalsHref } from '../utils/evalsHref.util';
import { passRateLabel } from '../utils/passRateLabel.util';

export const toSuiteSummaries = (runs: readonly RunFigures[]) => {
  const suites = [...new Set(runs.map(({ suite }) => suite))];

  return suites.flatMap((suite) => {
    const suiteRuns = runs.filter((run) => run.suite === suite);
    const [latest] = suiteRuns;

    if (latest === undefined) {
      return [];
    }

    const summary: SuiteSummary = {
      latest,
      points: suiteRuns
        .filter((run) => run.rate !== undefined)
        .toReversed()
        .map((run) => ({
          href: evalsHref({ runId: run.runId }),
          key: run.runId,
          label: `${run.startedAt.slice(0, 10)} on ${run.branch}: ${passRateLabel(run)}`,
          value: run.rate ?? 0,
        })),
      suite,
    };

    return [summary];
  });
};
