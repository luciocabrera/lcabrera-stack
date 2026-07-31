import { getRunById } from '@repo/scan-ingestion/queries/getRunById.util';
import { getRunScans } from '@repo/scan-ingestion/queries/getRunScans.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

import { createRunStatusTicket } from '@/auth/createRunStatusTicket.service';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({ runId: z.uuid() });

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { runId } = parseRouteParams({
    invalidMessage: 'Invalid run id.',
    params,
    schema: paramsSchema,
  });

  const run = await getRunById({ runId });
  if (!run) {
    throw data('Run not found.', { status: 404 });
  }

  const scansPromise = getRunScans({ runId });

  // The live-status ticket is minted here, and only here, because reaching
  // this line *is* the authorization: the cqms layout's loader has already
  // required a session, and the run above resolved for this caller. The
  // orchestrator verifies the signature and nothing else, so nothing further
  // downstream re-checks who may watch this run (ADR-041).
  return {
    run,
    scansPromise,
    statusTicket: createRunStatusTicket({ runId }),
  };
};
