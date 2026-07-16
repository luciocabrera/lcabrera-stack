import { describe, expect, it } from 'vitest';

import { createViewportRect } from './createViewportRect.util';

describe('createViewportRect', () => {
  it('spans the full viewport from the origin', () => {
    expect(createViewportRect({ height: 768, width: 1024 })).toEqual({
      bottom: 768,
      height: 768,
      left: 0,
      right: 1024,
      top: 0,
      width: 1024,
    });
  });

  it('produces an empty rect for zero dimensions', () => {
    expect(createViewportRect({ height: 0, width: 0 })).toEqual({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
    });
  });
});
