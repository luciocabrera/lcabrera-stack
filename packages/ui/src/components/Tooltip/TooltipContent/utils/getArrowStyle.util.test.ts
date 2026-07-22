import { describe, expect, it } from 'vitest';

import { getArrowStyle } from './getArrowStyle.util';

describe('getArrowStyle', () => {
  it.each(['top', 'bottom', 'left', 'right'] as const)(
    'returns a style for %s placement',
    (placement) => {
      expect(getArrowStyle({ arrowOffset: 20, placement })).toBeDefined();
    },
  );

  it('top and left return different styles', () => {
    const top = getArrowStyle({ arrowOffset: 20, placement: 'top' });
    const left = getArrowStyle({ arrowOffset: 20, placement: 'left' });
    expect(top).not.toBe(left);
  });
});
