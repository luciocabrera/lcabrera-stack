import { getScannerById } from '@repo/scan-ingestion/queries/getScannerById.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

const paramsSchema = z.object({
  scannerId: z.string().regex(/^[a-z0-9][a-z0-9-]{0,47}$/),
});

/** Awaited — needed to pre-fill the Form and to 404 on an unknown scanner. */
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

  return { scanner };
};
