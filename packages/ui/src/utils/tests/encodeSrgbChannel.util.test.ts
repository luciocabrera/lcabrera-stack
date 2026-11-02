import { describe, expect, it } from 'vite-plus/test';

import { encodeSrgbChannel } from './encodeSrgbChannel.util';

describe('encodeSrgbChannel', () => {
  it.each([
    { encoded: 0, linear: 0 },
    { encoded: 1, linear: 1 },
    { encoded: 0.04045, linear: 0.0031308 },
    { encoded: 0.735357, linear: 0.5 },
    { encoded: 0.01292, linear: 0.001 },
  ])('encodes $linear as $encoded', ({ encoded, linear }) => {
    expect(encodeSrgbChannel(linear)).toBeCloseTo(encoded, 5);
  });

  it('clamps a channel outside the gamut', () => {
    expect(encodeSrgbChannel(-0.2)).toBe(0);
    expect(encodeSrgbChannel(1.4)).toBeCloseTo(1, 10);
  });
});
