import type { LoaderFunctionArgs } from 'react-router';

import {
  selectRunComparison,
  selectRunSummaries,
} from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { selectComparedRuns } from '../.server/selectComparedRuns.service';
import { EVALS_COMPARE_CHOICES } from '../constants/evalsDashboard.constants';
import { runFigures } from '../utils/runFigures.util';
import { changedInputs } from './changedInputs.util';
import { compareSelection } from './compareSelection.util';
import { compareTotals } from './compareTotals.util';
import { flipList } from './flipList.util';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  requireEvalsDashboard();

  const selection = compareSelection(new URL(request.url).searchParams);

  if (selection.kind === 'invalid') {
    throw new Response('Not Found', { status: 404 });
  }

  if (selection.kind === 'pick') {
    const runs = await selectRunSummaries({
      scope: { kind: 'recent', perSuite: EVALS_COMPARE_CHOICES },
    });

    return {
      choices: runs.map((run) => runFigures(run)),
      comparison: undefined,
    };
  }

  const pair = await selectComparedRuns(selection);

  if (pair === undefined) {
    throw new Response('Not Found', { status: 404 });
  }

  const rows = await selectRunComparison({ a: pair.a.runId, b: pair.b.runId });
  const a = runFigures(pair.a);
  const b = runFigures(pair.b);

  return {
    choices: [],
    comparison: {
      a,
      b,
      changes: changedInputs({ a: pair.a, b: pair.b, rows }),
      flips: flipList(rows),
      tasks: rows.length,
      totals: compareTotals({ a, b }),
    },
  };
};
