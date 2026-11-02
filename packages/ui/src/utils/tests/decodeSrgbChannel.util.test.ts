import { describe, expect, it } from 'vite-plus/test';

import { decodeSrgbChannel } from './decodeSrgbChannel.util';

describe('decodeSrgbChannel', () => {
  it.each([
    { encoded: 0, linear: 0 },
    { encoded: 1, linear: 1 },
    { encoded: 0.04045, linear: 0.0031308 },
    { encoded: 0.735357, linear: 0.5 },
    { encoded: 0.01292, linear: 0.001 },
  ])('decodes $encoded as $linear', ({ encoded, linear }) => {
    expect(decodeSrgbChannel(encoded)).toBeCloseTo(linear, 5);
  });
});
