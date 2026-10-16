import { describe, expect, it } from 'vite-plus/test';

import { intervalLabel } from './intervalLabel.util';

describe('intervalLabel', () => {
  it('writes both bounds as percentages', () => {
    expect(intervalLabel({ lower: 0.494, upper: 0.943 })).toBe('49% to 94%');
  });

  it('says when there is no interval', () => {
    expect(intervalLabel({ lower: undefined, upper: undefined })).toBe(
      'too few trials for an interval',
    );
  });
});
