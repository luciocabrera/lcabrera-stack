import type { ZodError } from 'zod';

import type { EditScannerValues } from './editScanner.schema';

type ToEditScannerFieldErrorsArgs = {
  readonly error: ZodError<EditScannerValues>;
};

/**
 * The per-field messages the edit form renders. There is no scannerId here —
 * it is immutable (ADR-023), so editing cannot fail on it.
 */
export const toEditScannerFieldErrors = ({
  error,
}: ToEditScannerFieldErrorsArgs) => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    configDetection: fieldErrors.configDetection?.[0],
    displayName: fieldErrors.displayName?.[0],
  };
};
