import type { Location } from 'react-router';

import { describe, expect, it } from 'vite-plus/test';

import { isSubmittingField } from './isSubmittingField.util';

const pending = (search: string): Location => ({
  hash: '',
  key: 'pending',
  pathname: '/evals/compare',
  search,
  state: undefined,
});

describe('isSubmittingField', () => {
  it('is false while no navigation is pending', () => {
    expect(isSubmittingField({ field: 'a', location: undefined })).toBe(false);
  });

  it('is true when the pending location carries the field', () => {
    expect(
      isSubmittingField({ field: 'branch', location: pending('?branch=feat') }),
    ).toBe(true);
  });

  it('is false when the pending location carries another form’s fields', () => {
    expect(
      isSubmittingField({ field: 'branch', location: pending('?a=r1&b=r2') }),
    ).toBe(false);
  });
});
