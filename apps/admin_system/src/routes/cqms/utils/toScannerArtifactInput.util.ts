import type { ScannerFieldValues } from './scannerFields.schema';

import { parseAllowedTools } from './parseAllowedTools.util';

type ToScannerArtifactInputArgs = {
  readonly scannerId: string;
  readonly values: ScannerFieldValues;
};

/**
 * Maps the shared form values onto writeScannerArtifacts' arguments — the
 * best-effort on-disk scaffolding both authoring routes perform after a
 * successful save (ADR-023).
 */
export const toScannerArtifactInput = ({
  scannerId,
  values,
}: ToScannerArtifactInputArgs) => ({
  allowedTools: parseAllowedTools({ allowedTools: values.allowedTools }),
  description: values.description || undefined,
  displayName: values.displayName,
  isDeterministic: values.deterministic,
  rawArtifactFileName: values.rawArtifactFileName || undefined,
  scannerId,
  stepsMarkdown: values.stepsMarkdown || undefined,
});
