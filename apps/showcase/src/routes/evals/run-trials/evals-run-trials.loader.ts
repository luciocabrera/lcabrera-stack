import type { LoaderFunctionArgs } from 'react-router';

import { selectRunTrials } from '../.server/evalsHistory.service';
import { requireEvalsDashboard } from '../.server/requireEvalsDashboard.service';
import { isRunId } from '../utils/isRunId.util';
import { toTrialPage } from '../utils/toTrialPage.util';
import { parseTrialPageParams } from './parseTrialPageParams.util';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  requireEvalsDashboard();

  const { runId } = params;

  if (!isRunId(runId)) {
    throw new Response('Not Found', { status: 404 });
  }

  const page = await selectRunTrials({
    runId,
    ...parseTrialPageParams(new URL(request.url).searchParams),
  });

  return Response.json(toTrialPage(page));
};
