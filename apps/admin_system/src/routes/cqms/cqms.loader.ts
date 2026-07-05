import { getProjectListView } from '@repo/scan-ingestion/queries/getProjectListView.util';

/**
 * Returns the promise directly (not awaited) for Suspense streaming —
 * matching `enterprise-orders.loader.ts`'s own convention: the route
 * shell renders immediately, `TableLayout`'s internal
 * `TableSuspenseBoundary` shows a skeleton until `projectsPromise`
 * resolves.
 */
export const loader = () => {
  const projectsPromise = getProjectListView();
  return { projectsPromise };
};
