import type { ScannerLlmCostRow } from '@repo/scan-ingestion/queries/getScannerLlmCost.util';

export type ScannerLlmCostTableProps = {
  readonly scannerCostPromise: Promise<readonly ScannerLlmCostRow[]>;
};
