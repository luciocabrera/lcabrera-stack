import { expect, it } from 'vitest';

import { isCheckboxChecked } from './is-checkbox-checked.util';

it('is true when the checkbox posted "on"', () => {
  const formData = new FormData();
  formData.set('is_gift', 'on');

  expect(isCheckboxChecked({ formData, name: 'is_gift' })).toBe(true);
});

it('is false when the checkbox is absent', () => {
  expect(isCheckboxChecked({ formData: new FormData(), name: 'is_gift' })).toBe(
    false,
  );
});

it('is false for any value other than "on"', () => {
  const formData = new FormData();
  formData.set('is_gift', '');

  expect(isCheckboxChecked({ formData, name: 'is_gift' })).toBe(false);
});
