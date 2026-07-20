import { expect, it } from 'vitest';

import { readFormString } from './read-form-string.util';

it('reads a present string value', () => {
  const formData = new FormData();
  formData.set('customer_name', 'Ada');

  expect(readFormString({ formData, name: 'customer_name' })).toBe('Ada');
});

it('defaults a missing entry to an empty string', () => {
  expect(
    readFormString({ formData: new FormData(), name: 'customer_name' }),
  ).toBe('');
});

it('defaults a File entry to an empty string', () => {
  const formData = new FormData();
  formData.set('customer_name', new File([], 'x.txt'));

  expect(readFormString({ formData, name: 'customer_name' })).toBe('');
});
