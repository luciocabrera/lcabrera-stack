import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

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

  it('applies the busy class only when isBusy is true', () => {
    const busyClass = stylex.props(linkItemStyles.busyLink).className;

    const busy = getClassName({
      isActive: false,
      isBusy: true,
      orientation: 'horizontal',
      size: 'mini',
      styles: linkItemStyles,
      variant: 'outline',
    });
    const idle = getClassName({
      isActive: false,
      isBusy: false,
      orientation: 'horizontal',
      size: 'mini',
      styles: linkItemStyles,
      variant: 'outline',
    });

    expect(busy.split(' ')).toContain(busyClass);
    expect(idle.split(' ')).not.toContain(busyClass);
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
