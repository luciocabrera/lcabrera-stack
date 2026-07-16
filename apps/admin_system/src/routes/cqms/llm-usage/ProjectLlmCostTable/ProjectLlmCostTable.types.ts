import type { ProjectLlmCostRow } from '@repo/scan-ingestion/queries/getProjectLlmCost.util';

export type ProjectLlmCostTableProps = {
  readonly projectCostPromise: Promise<readonly ProjectLlmCostRow[]>;
};
