import type { FieldErrors } from '@lcabrera/ui/components/Form';
import type { DiscoveredWorkspace } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import type { ScannerRow } from '@repo/scan-ingestion/queries/getActiveScanners.util';

import type { TriggerScanValues } from '../triggerScan.schema';

export type TriggerScanFormProps = {
  readonly projectId: string;
  readonly scannersPromise: Promise<readonly ScannerRow[]>;
  readonly serverErrors?: FieldErrors<TriggerScanValues>;
  readonly workspacesPromise: Promise<readonly DiscoveredWorkspace[]>;
};
