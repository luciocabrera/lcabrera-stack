import type { ProjectRunRow } from '@repo/scan-ingestion/queries/getProjectRuns.util';

export type RunLinkProps = {
  readonly run: ProjectRunRow;
};
