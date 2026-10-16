import { describe, expect, it } from 'vite-plus/test';

import { durationLabel } from './durationLabel.util';

describe('durationLabel', () => {
  it.each([
    { label: '0s', milliseconds: 400 },
    { label: '12s', milliseconds: 12_400 },
    { label: '40m 0s', milliseconds: 2_400_000 },
    { label: '1h 2m', milliseconds: 3_725_000 },
    { label: '0s', milliseconds: -5 },
  ])('writes $milliseconds ms as $label', ({ label, milliseconds }) => {
    expect(durationLabel(milliseconds)).toBe(label);
  });
});
