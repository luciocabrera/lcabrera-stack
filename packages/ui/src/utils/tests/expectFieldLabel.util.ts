/**
 * Asserts that a form control is named by a visible field label: a small, medium-weight `label` that sits beside it in the shared field wrapper.
 */

import { screen } from '@testing-library/react';
import { expect } from 'vite-plus/test';

import { formInputStyles } from '#ui/components/Form/fields/formInput.stylex';
import { styles as textStyles } from '#ui/components/Text/Text.stylex';

import { hasStylexStyle } from './hasStylexStyle.util';

export const expectFieldLabel = (text: string) => {
  const label = screen.getByText(text);
  const control = screen.getByLabelText(text);

  expect(label.tagName).toBe('LABEL');
  expect(label.getAttribute('for')).toBe(control.id);
  expect(label.parentElement).toBe(control.parentElement);
  expect([
    hasStylexStyle({ element: label, style: textStyles.size.sm }),
    hasStylexStyle({ element: label, style: textStyles.weight.medium }),
    hasStylexStyle({
      element: control.parentElement as Element,
      style: formInputStyles.field,
    }),
  ]).toStrictEqual([true, true, true]);

  return control;
};
