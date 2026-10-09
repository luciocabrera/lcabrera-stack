import type { LoaderFunctionArgs } from 'react-router';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type { TrialPage, TrialTableRow } from '../types/trialTableRow.types';

import {
  selectRunSummaries,
  selectRunTrials,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { EVALS_CHART_TRIALS } from '../constants/evalsDashboard.constants';
import { isRunId } from '../utils/isRunId.util';
import { parseTrialId } from '../utils/parseTrialId.util';
import { runFigures } from '../utils/runFigures.util';
import { toTrialPage } from '../utils/toTrialPage.util';
import { toTrialSorting } from '../utils/toTrialSorting.util';
import { trialChartPoints } from '../utils/trialChartPoints.util';
import {
  COLUMNS,
  PERSISTENCE_KEY,
  TABLE_NAME,
  TITLE,
} from './EvalsRun.constants';

export const loader = async (args: LoaderFunctionArgs) => {
  requireEvalsDashboard();

  const { runId } = args.params;

  if (!isRunId(runId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const [run] = await selectRunSummaries({
    scope: { kind: 'run', runId },
  });

  if (run === undefined) {
    throw new Response('Not Found', { status: 404 });
  }

  const trialId = parseTrialId(
    new URL(args.request.url).searchParams.get('trial'),
  );
  const page = { offset: 0, runId };
  const tableLoader = createTableRouteLoader<TrialTableRow, TrialPage>({
    appId: APP_ID,
    columns: COLUMNS,
    fetchPage: async ({ effectiveSorting }) =>
      toTrialPage(
        await selectRunTrials({
          ...page,
          limit: INITIAL_PAGE_SIZE,
          sorting: toTrialSorting(effectiveSorting),
        }),
      ),
    includeFilters: false,
    persistenceKey: PERSISTENCE_KEY,
    tableName: TABLE_NAME,
    title: TITLE,
  });
  const [table, chart, selected] = await Promise.all([
    tableLoader(args),
    selectRunTrials({ ...page, limit: EVALS_CHART_TRIALS, sorting: [] }),
    trialId === undefined
      ? undefined
      : selectRunTrials({ ...page, limit: 1, sorting: [], trialId }),
  ]);

  return {
    ...table,
    chart: trialChartPoints({ runId, trials: chart.data }),
    chartTotal: chart.total,
    run: runFigures(run),
    selectedTrial: selected?.data[0],
  };
};
