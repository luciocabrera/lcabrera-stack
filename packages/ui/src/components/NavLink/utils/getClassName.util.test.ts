import { describe, expect, it } from 'vitest';

import { linkItemStyles } from '../NavLink.stylex';
import { getClassName } from './getClassName.util';

describe('getClassName', () => {
  it('returns a string', () => {
    const result = getClassName({
      variant: 'primary',
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
    });
    expect(typeof result).toBe('string');
  });

  it('returns a string when isActive is true', () => {
    const result = getClassName({
      variant: 'primary',
      isActive: true,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
    });
    expect(typeof result).toBe('string');
  });

  it('accepts width parameter', () => {
    const result = getClassName({
      variant: 'primary',
      isActive: false,
      orientation: 'vertical',
      size: 'sm',
      styles: linkItemStyles,
      width: 'full',
    });
    expect(typeof result).toBe('string');
  });

  it('defaults width to auto when not provided', () => {
    const withAuto = getClassName({
      variant: 'primary',
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
      width: 'auto',
    });
    const withoutWidth = getClassName({
      variant: 'primary',
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
    });
    expect(withAuto).toBe(withoutWidth);
  });

  it('keeps deprecated color-compatible semantics through variant values', () => {
    const outline = getClassName({
      variant: 'outline',
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
    });

    expect(typeof outline).toBe('string');
  });
});
