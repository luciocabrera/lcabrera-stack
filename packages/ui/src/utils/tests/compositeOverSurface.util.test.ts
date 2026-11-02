import { describe, expect, it } from 'vite-plus/test';

import { compositeOverSurface } from './compositeOverSurface.util';

describe('compositeOverSurface', () => {
  it('keeps an opaque colour', () => {
    expect(
      compositeOverSurface({
        color: { alpha: 1, rgb: [0.2, 0.4, 0.6] },
        surface: [1, 1, 1],
      }),
    ).toEqual([0.2, 0.4, 0.6]);
  });

  it('shows the surface through a transparent colour', () => {
    expect(
      compositeOverSurface({
        color: { alpha: 0, rgb: [0.2, 0.4, 0.6] },
        surface: [1, 0.5, 0],
      }),
    ).toEqual([1, 0.5, 0]);
  });

  it('blends each channel by the alpha', () => {
    expect(
      compositeOverSurface({
        color: { alpha: 0.25, rgb: [0, 1, 0.4] },
        surface: [1, 0, 0.8],
      }),
    ).toEqual([
      expect.closeTo(0.75, 10),
      expect.closeTo(0.25, 10),
      expect.closeTo(0.7, 10),
    ]);
  });
});
