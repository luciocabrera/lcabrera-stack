import type { RunScanRow } from '@repo/scan-ingestion/queries/getRunScans.util';

export type ScanLinkProps = {
  readonly scan: RunScanRow;
};
