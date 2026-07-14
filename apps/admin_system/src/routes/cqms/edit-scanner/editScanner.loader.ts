import { getScannerById } from '@repo/scan-ingestion/queries/getScannerById.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({
  scannerId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/),
});

/** Awaited — needed to pre-fill the Form and to 404 on an unknown scanner. */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { scannerId } = parseRouteParams({
    invalidMessage: 'Invalid scanner id.',
    params,
    schema: paramsSchema,
  });

  const scanner = await getScannerById({ scannerId });
  if (!scanner) {
    throw data('Scanner not found.', { status: 404 });
  }

  return { scanner };
};
