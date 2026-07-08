import { getCappedLlmUsageAttempts } from '@repo/scan-ingestion/queries/getCappedLlmUsageAttempts.util';
import { getDailyLlmCost } from '@repo/scan-ingestion/queries/getDailyLlmCost.util';
import { getProjectLlmCost } from '@repo/scan-ingestion/queries/getProjectLlmCost.util';
import { getScannerLlmCost } from '@repo/scan-ingestion/queries/getScannerLlmCost.util';

/**
 * Every promise streams unawaited (Suspense), same convention as
 * scanners.loader.ts — the `cqms` layout loader already gates every child
 * route, so no explicit auth check is needed here.
 */
export const loader = () => {
  const cappedAttemptsPromise = getCappedLlmUsageAttempts({ limit: 100 });
  const dailyCostPromise = getDailyLlmCost();
  const projectCostPromise = getProjectLlmCost();
  const scannerCostPromise = getScannerLlmCost();

  return {
    cappedAttemptsPromise,
    dailyCostPromise,
    projectCostPromise,
    scannerCostPromise,
  };
};
