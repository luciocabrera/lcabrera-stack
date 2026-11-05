import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';

import { getColorTokenName } from './getColorTokenName.util';

describe('getColorTokenName', () => {
  it('names the token a compiled variable belongs to', () => {
    expect(getColorTokenName(colors.textSecondary)).toBe('textSecondary');
    expect(getColorTokenName(colors.brandPrimaryCardText)).toBe(
      'brandPrimaryCardText',
    );
  });

  it('refuses a value that is not a colour token', () => {
    expect(() => getColorTokenName('var(--unknown)')).toThrow(
      'var(--unknown) is not a colour token',
    );
  });
});
