import { getScannerById } from '@repo/scan-ingestion/queries/getScannerById.util';
import { getScannerVersions } from '@repo/scan-ingestion/queries/getScannerVersions.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({
  scannerId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/),
});

/**
 * The scanner row is awaited (the page header needs it, and an unknown id
 * must 404); the version history streams like every other table promise.
 */
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

  const versionsPromise = getScannerVersions({ scannerId });
  return { scanner, versionsPromise };
};
