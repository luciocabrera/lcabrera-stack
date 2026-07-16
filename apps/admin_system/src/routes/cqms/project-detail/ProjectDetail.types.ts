import type { ProjectRow } from '@repo/scan-ingestion/queries/getProjectById.util';

export type RenderTriggerAffordanceArgs = {
  readonly hasActiveRun: boolean;
  readonly project: ProjectRow;
};
