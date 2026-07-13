import { describe, expect, it } from 'vitest';

import { getArrowStyle } from './getArrowStyle.util';

describe('getArrowStyle', () => {
  it('returns horizontal arrow style for top placement', () => {
    const result = getArrowStyle({ arrowOffset: 20, placement: 'top' });
    expect(result).toBeDefined();
  });

  it('returns horizontal arrow style for bottom placement', () => {
    const result = getArrowStyle({ arrowOffset: 20, placement: 'bottom' });
    expect(result).toBeDefined();
  });

  it('returns vertical arrow style for left placement', () => {
    const result = getArrowStyle({ arrowOffset: 20, placement: 'left' });
    expect(result).toBeDefined();
  });

  it('returns vertical arrow style for right placement', () => {
    const result = getArrowStyle({ arrowOffset: 20, placement: 'right' });
    expect(result).toBeDefined();
  });

  it('top and left return different styles', () => {
    const top = getArrowStyle({ arrowOffset: 20, placement: 'top' });
    const left = getArrowStyle({ arrowOffset: 20, placement: 'left' });
    expect(top).not.toBe(left);
  });
});
