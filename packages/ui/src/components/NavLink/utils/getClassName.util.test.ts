import { describe, expect, it } from 'vitest';

import { linkItemStyles } from '../NavLink.stylex';
import { getClassName } from './getClassName.util';

describe('getClassName', () => {
  it('returns a string', () => {
    const result = getClassName({
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
      variant: 'primary',
    });
    expect(typeof result).toBe('string');
  });

  it('returns a string when isActive is true', () => {
    const result = getClassName({
      isActive: true,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
      variant: 'primary',
    });
    expect(typeof result).toBe('string');
  });

  it('accepts width parameter', () => {
    const result = getClassName({
      isActive: false,
      orientation: 'vertical',
      size: 'sm',
      styles: linkItemStyles,
      variant: 'primary',
      width: 'full',
    });
    expect(typeof result).toBe('string');
  });

  it('defaults width to auto when not provided', () => {
    const withAuto = getClassName({
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
      variant: 'primary',
      width: 'auto',
    });
    const withoutWidth = getClassName({
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
      variant: 'primary',
    });
    expect(withAuto).toBe(withoutWidth);
  });

  it('keeps deprecated color-compatible semantics through variant values', () => {
    const outline = getClassName({
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
      variant: 'outline',
    });

    expect(typeof outline).toBe('string');
  });
});
