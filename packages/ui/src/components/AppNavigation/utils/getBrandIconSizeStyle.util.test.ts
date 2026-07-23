import { describe, expect, it } from 'vite-plus/test';

import { styles } from '../AppNavigation.stylex';
import { getBrandIconSizeStyle } from './getBrandIconSizeStyle.util';

describe('getBrandIconSizeStyle', () => {
  it('returns brandIconSizeMini for "mini"', () => {
    expect(getBrandIconSizeStyle('mini')).toBe(styles.brandIconSizeMini);
  });

  it('returns brandIconSizeSm for "sm"', () => {
    expect(getBrandIconSizeStyle('sm')).toBe(styles.brandIconSizeSm);
  });

  it('returns brandIconSizeMd for "md"', () => {
    expect(getBrandIconSizeStyle('md')).toBe(styles.brandIconSizeMd);
  });

  it('returns a different style for each input', () => {
    expect(getBrandIconSizeStyle('mini')).not.toBe(getBrandIconSizeStyle('sm'));
    expect(getBrandIconSizeStyle('mini')).not.toBe(getBrandIconSizeStyle('md'));
    expect(getBrandIconSizeStyle('sm')).not.toBe(getBrandIconSizeStyle('md'));
  });
});
