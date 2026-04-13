import { describe, expect, it } from 'vitest';

import { linkItemStyles } from '../NavLink.stylex.ts';
import { getClassName } from './getClassName.util.ts';

describe('getClassName', () => {
  it('returns a string', () => {
    const result = getClassName({
      color: 'primary',
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
    });
    expect(typeof result).toBe('string');
  });

  it('returns a string when isActive is true', () => {
    const result = getClassName({
      color: 'primary',
      isActive: true,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
    });
    expect(typeof result).toBe('string');
  });

  it('accepts width parameter', () => {
    const result = getClassName({
      color: 'primary',
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
      color: 'primary',
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
      width: 'auto',
    });
    const withoutWidth = getClassName({
      color: 'primary',
      isActive: false,
      orientation: 'horizontal',
      size: 'md',
      styles: linkItemStyles,
    });
    expect(withAuto).toBe(withoutWidth);
  });
});
