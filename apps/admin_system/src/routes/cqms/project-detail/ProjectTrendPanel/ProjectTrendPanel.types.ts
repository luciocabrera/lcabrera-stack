import type { ProjectScannerTrendRow } from '@repo/scan-ingestion/queries/getProjectScannerTrend.util';

export type ProjectTrendPanelProps = {
  readonly trendPromise: Promise<readonly ProjectScannerTrendRow[]>;
};
