import * as stylex from '@stylexjs/stylex';
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

  it('applies the full-width class for every size, including mini and embedded', () => {
    const fullWidthClass = stylex.props(linkItemStyles.fullWidth).className;

    for (const size of ['embedded', 'mini', 'sm', 'md', 'lg'] as const) {
      const result = getClassName({
        isActive: false,
        orientation: 'vertical',
        size,
        styles: linkItemStyles,
        variant: 'primary',
      });

      expect(result.split(' ')).toContain(fullWidthClass);
    }
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
