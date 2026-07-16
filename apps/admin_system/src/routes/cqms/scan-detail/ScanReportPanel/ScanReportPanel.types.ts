import type { ScanReportRow } from '@repo/scan-ingestion/queries/getScanReport.util';

export type ScanReportPanelProps = {
  readonly reportPromise: Promise<ScanReportRow | undefined>;
};
