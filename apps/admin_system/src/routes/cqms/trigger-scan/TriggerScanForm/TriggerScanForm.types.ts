import type { ScannerRow } from '@repo/scan-ingestion/queries/getActiveScanners.util';
import type { FieldErrors } from '@repo/ui/components/Form';

import type { TriggerScanValues } from '../triggerScan.schema';

export type TriggerScanFormProps = {
  readonly projectId: string;
  readonly scannersPromise: Promise<readonly ScannerRow[]>;
  readonly serverErrors?: FieldErrors<TriggerScanValues>;
};
