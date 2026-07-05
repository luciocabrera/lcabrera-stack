import { getScanById } from '@repo/scan-ingestion/queries/getScanById.util';
import { getScanFindings } from '@repo/scan-ingestion/queries/getScanFindings.util';
import { getScanReport } from '@repo/scan-ingestion/queries/getScanReport.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

import { buildJsonExplorerSections } from '../utils/buildJsonExplorerSections.util';

const paramsSchema = z.object({ scanId: z.string().uuid() });

/**
 * `scan` is awaited directly — needed for the 404 check and to compute
 * `jsonSections` server-side (column inference must happen here, never
 * client-side; it only reads `scan.raw_json`, not the report). `report`
 * and `findings` both stream via unawaited promises — neither is needed
 * for the 404 check, so neither should block the page.
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid scan id.', { status: 400 });
  }

  const { scanId } = parsedParams.data;

  const scan = await getScanById({ scanId });
  if (!scan) {
    throw data('Scan not found.', { status: 404 });
  }

  const reportPromise = getScanReport({ scanId });
  const findingsPromise = getScanFindings({ limit: 50, scanId, skip: 0 });
  const jsonSections = buildJsonExplorerSections(scan.raw_json);

  return { findingsPromise, jsonSections, reportPromise, scan };
};
