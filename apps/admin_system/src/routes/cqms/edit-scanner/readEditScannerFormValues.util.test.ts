import { describe, expect, it } from 'vite-plus/test';

import { readEditScannerFormValues } from './readEditScannerFormValues.util';

describe('readEditScannerFormValues', () => {
  it('adds the edit-only isActive toggle to the shared fields', () => {
    const formData = new FormData();
    formData.set('isActive', 'on');
    formData.set('displayName', 'Linter');

    const values = readEditScannerFormValues({ formData });

    expect(values.isActive).toBe(true);
    expect(values.displayName).toBe('Linter');
  });

  it('reads an unchecked isActive as false, since the box posts nothing', () => {
    expect(
      readEditScannerFormValues({ formData: new FormData() }).isActive,
    ).toBe(false);
  });
});
