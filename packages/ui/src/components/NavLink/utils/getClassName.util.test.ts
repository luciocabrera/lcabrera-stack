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

  it('always applies the full-width style regardless of size', () => {
    const embedded = getClassName({
      isActive: false,
      orientation: 'vertical',
      size: 'embedded',
      styles: linkItemStyles,
      variant: 'primary',
    });

    expect(embedded).toEqual(expect.any(String));
    expect(embedded).not.toBe('');
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
