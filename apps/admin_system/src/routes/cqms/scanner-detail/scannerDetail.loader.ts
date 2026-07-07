import { getScannerById } from '@repo/scan-ingestion/queries/getScannerById.util';
import { getScannerVersions } from '@repo/scan-ingestion/queries/getScannerVersions.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

const paramsSchema = z.object({
  scannerId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/),
});

/**
 * The scanner row is awaited (the page header needs it, and an unknown id
 * must 404); the version history streams like every other table promise.
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid scanner id.', { status: 400 });
  }

  const scanner = await getScannerById({
    scannerId: parsedParams.data.scannerId,
  });
  if (!scanner) {
    throw data('Scanner not found.', { status: 404 });
  }

  const versionsPromise = getScannerVersions({
    scannerId: parsedParams.data.scannerId,
  });
  return { scanner, versionsPromise };
};
