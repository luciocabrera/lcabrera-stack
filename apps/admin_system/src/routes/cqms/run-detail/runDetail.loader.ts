import { getRunById } from '@repo/scan-ingestion/queries/getRunById.util';
import { getRunScans } from '@repo/scan-ingestion/queries/getRunScans.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({ runId: z.string().uuid() });

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

  return { run, scansPromise };
};
