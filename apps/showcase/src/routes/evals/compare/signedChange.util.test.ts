import { describe, expect, it } from 'vite-plus/test';

import { signedChange } from './signedChange.util';

const format = (magnitude: number) => `${String(magnitude)} u`;

describe('signedChange', () => {
  it('signs a rise and a fall', () => {
    expect(signedChange({ after: 5, before: 2, format })).toBe('+3 u');
    expect(signedChange({ after: 2, before: 5, format })).toBe('-3 u');
  });

  it('says when nothing moved', () => {
    expect(signedChange({ after: 2, before: 2, format })).toBe('no change');
  });

  it('refuses to compare a missing figure', () => {
    expect(signedChange({ after: undefined, before: 2, format })).toBe(
      'not comparable',
    );
  });
});
