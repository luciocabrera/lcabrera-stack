import { getRunById } from '@repo/scan-ingestion/queries/getRunById.util';
import { getRunScans } from '@repo/scan-ingestion/queries/getRunScans.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

const paramsSchema = z.object({ runId: z.string().uuid() });

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid run id.', { status: 400 });
  }

  const { runId } = parsedParams.data;

  const run = await getRunById({ runId });
  if (!run) {
    throw data('Run not found.', { status: 404 });
  }

  const scansPromise = getRunScans({ runId });

  return { run, scansPromise };
};
