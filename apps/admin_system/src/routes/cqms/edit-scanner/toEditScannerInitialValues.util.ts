import type { ScannerRegistryRow } from '@repo/scan-ingestion/queries/getScannerById.util';

import type { EditScannerValues } from './editScanner.schema';

/**
 * Map a scanner registry row to the edit form's initial values: nullable
 * columns fall back to empty strings, allowed tools join to a comma list,
 * and config detection pretty-prints to editable JSON.
 */
export const toEditScannerInitialValues = (
  scanner: ScannerRegistryRow,
): EditScannerValues => ({
  allowedTools: (scanner.allowed_tools ?? []).join(', '),
  commandTemplate: scanner.command_template ?? '',
  configDetection: scanner.config_detection
    ? JSON.stringify(scanner.config_detection, undefined, 2)
    : '',
  description: scanner.description ?? '',
  deterministic: scanner.deterministic,
  displayName: scanner.display_name,
  isActive: scanner.is_active,
  rawArtifactFileName: scanner.raw_artifact_file_name ?? '',
  stepsMarkdown: scanner.steps_markdown ?? '',
  supportsDiffScope: scanner.supports_diff_scope,
});
