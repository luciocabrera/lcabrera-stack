import { describe, expect, it } from 'vitest';

import { isCheckboxChecked } from './isCheckboxChecked.util';

describe('isCheckboxChecked', () => {
  it("is true only for the native checked value 'on'", () => {
    const formData = new FormData();
    formData.set('checked', 'on');
    formData.set('crafted', '');
    formData.set('spoofed', 'yes');

    expect(isCheckboxChecked({ formData, name: 'checked' })).toBe(true);
    expect(isCheckboxChecked({ formData, name: 'crafted' })).toBe(false);
    expect(isCheckboxChecked({ formData, name: 'spoofed' })).toBe(false);
    expect(isCheckboxChecked({ formData, name: 'absent' })).toBe(false);
  });
});
