import { isCheckboxChecked } from '@repo/utils/forms/is-checkbox-checked.util';

import { readScannerFormValues } from '../utils/readScannerFormValues.util';

type ReadEditScannerFormValuesArgs = {
  readonly formData: FormData;
};

/**
 * The shared scanner fields plus `isActive`, which only editing posts — ready
 * for editScannerSchema.
 */
export const readEditScannerFormValues = ({
  formData,
}: ReadEditScannerFormValuesArgs) => ({
  ...readScannerFormValues({ formData }),
  isActive: isCheckboxChecked({ formData, name: 'isActive' }),
});
