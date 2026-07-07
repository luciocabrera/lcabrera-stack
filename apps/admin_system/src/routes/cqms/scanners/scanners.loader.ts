import { getScannerListView } from '@repo/scan-ingestion/queries/getScannerListView.util';

/**
 * Returns the promise directly (not awaited) for Suspense streaming — the
 * same convention as cqms.loader.ts: the route shell renders immediately
 * and TableLayout's internal suspense boundary shows a skeleton until
 * `scannersPromise` resolves.
 */
export const loader = () => {
  const scannersPromise = getScannerListView();
  return { scannersPromise };
};
