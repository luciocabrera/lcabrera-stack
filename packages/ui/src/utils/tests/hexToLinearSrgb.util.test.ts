import { describe, expect, it } from 'vite-plus/test';

import { hexToLinearSrgb } from './hexToLinearSrgb.util';

describe('hexToLinearSrgb', () => {
  it('linearises each channel of an opaque value', () => {
    expect(hexToLinearSrgb('#ff8000')).toEqual({
      alpha: 1,
      rgb: [1, expect.closeTo(0.2158, 3), 0],
    });
  });

  it('reads the eighth-digit alpha without linearising it', () => {
    expect(hexToLinearSrgb('#FFFFFF99')).toEqual({
      alpha: 0.6,
      rgb: [1, 1, 1],
    });
  });

  it.each(['#fff', '#ffff', '#ffffffa', '#gggggg'])('refuses %s', (value) => {
    expect(() => hexToLinearSrgb(value)).toThrow(
      `Unsupported colour value ${value}`,
    );
  });
});
