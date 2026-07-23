import { describe, expect, it } from 'vite-plus/test';

import { readNewScannerFormValues } from './readNewScannerFormValues.util';

describe('readNewScannerFormValues', () => {
  it('adds the registration-only scannerId to the shared fields', () => {
    const formData = new FormData();
    formData.set('scannerId', 'my-linter');
    formData.set('displayName', 'Linter');

    const values = readNewScannerFormValues({ formData });

    expect(values.scannerId).toBe('my-linter');
    expect(values.displayName).toBe('Linter');
  });

  it('falls back to an empty scannerId so the schema reports the field error', () => {
    expect(
      readNewScannerFormValues({ formData: new FormData() }).scannerId,
    ).toBe('');
  });
});
