/**
 * Input attributes that disable browser/password-manager autofill and
 * autocomplete for filter inputs. Spread onto native `<input>` elements.
 */
export const NO_AUTOFILL_INPUT_PROPS = {
  autoComplete: 'one-time-code',
  'data-1p-ignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
  'data-lpignore': 'true',
} as const;
