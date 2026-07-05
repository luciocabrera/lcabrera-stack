import { getActiveScanners } from '@repo/scan-ingestion/queries/getActiveScanners.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

const paramsSchema = z.object({ projectId: z.string().uuid() });

/**
 * `scanners` streams via an unawaited promise — this is a small lookup,
 * but nothing here needs it synchronously (no 404 check depends on it),
 * so it follows the same list-streaming convention as everything else in
 * this route tree rather than blocking the page.
 */
export const loader = ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const scannersPromise = getActiveScanners();
  return { projectId: parsedParams.data.projectId, scannersPromise };
};
