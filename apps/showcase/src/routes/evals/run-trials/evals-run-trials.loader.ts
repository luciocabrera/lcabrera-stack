import type { LoaderFunctionArgs } from 'react-router';

import { evalsReaderPool } from '@repo/eval-history/queries/evalsReaderPool.service';
import { readRunTrials } from '@repo/eval-history/queries/readRunTrials.service';

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

  const page = await readRunTrials({
    client: evalsReaderPool(),
    runId,
    ...parseTrialPageParams(new URL(request.url).searchParams),
  });

  return Response.json(toTrialPage(page));
};
