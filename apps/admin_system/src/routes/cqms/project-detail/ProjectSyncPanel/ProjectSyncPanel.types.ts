import type { ProjectRow } from '@repo/scan-ingestion/queries/getProjectById.util';

export type ProjectSyncPanelProps = {
  readonly project: ProjectRow;
};
