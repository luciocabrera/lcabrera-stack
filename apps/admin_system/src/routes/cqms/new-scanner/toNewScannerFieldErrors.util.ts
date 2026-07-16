import type { ZodError } from 'zod';

import type { NewScannerValues } from './newScanner.schema';

type ToNewScannerFieldErrorsArgs = {
  readonly error: ZodError<NewScannerValues>;
};

/**
 * The per-field messages the registration form renders. Only the three fields
 * that can actually fail validation are surfaced — the rest are free text the
 * schema only trims.
 */
export const toNewScannerFieldErrors = ({
  error,
}: ToNewScannerFieldErrorsArgs) => {
  const fieldErrors = error.flatten().fieldErrors;

  return {
    configDetection: fieldErrors.configDetection?.[0],
    displayName: fieldErrors.displayName?.[0],
    scannerId: fieldErrors.scannerId?.[0],
  };
};
