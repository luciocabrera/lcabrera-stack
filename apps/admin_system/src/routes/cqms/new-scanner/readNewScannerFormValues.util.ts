import { readScannerFormValues } from '../utils/readScannerFormValues.util';

type ReadNewScannerFormValuesArgs = {
  readonly formData: FormData;
};

/**
 * The shared scanner fields plus `scannerId`, which only registration posts —
 * ready for newScannerSchema.
 */
export const readNewScannerFormValues = ({
  formData,
}: ReadNewScannerFormValuesArgs) => ({
  ...readScannerFormValues({ formData }),
  scannerId: formData.get('scannerId') ?? '',
});
