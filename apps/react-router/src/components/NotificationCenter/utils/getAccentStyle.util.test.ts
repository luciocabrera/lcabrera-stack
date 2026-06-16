import { describe, expect, it } from 'vitest';

import { styles } from '../NotificationCenter.stylex';

import { getAccentStyle } from './getAccentStyle.util';

describe('getAccentStyle', () => {
  it('returns the mapped style for each explicit variant', () => {
    expect(getAccentStyle('error')).toBe(styles.itemSurfaceError);
    expect(getAccentStyle('info')).toBe(styles.itemSurfaceInfo);
    expect(getAccentStyle('primary')).toBe(styles.itemSurfacePrimary);
    expect(getAccentStyle('secondary')).toBe(styles.itemSurfaceSecondary);
    expect(getAccentStyle('success')).toBe(styles.itemSurfaceSuccess);
    expect(getAccentStyle('warning')).toBe(styles.itemSurfaceWarning);
  });

  it('returns default style for default variant', () => {
    expect(getAccentStyle('default')).toBe(styles.itemSurfaceDefault);
  });
});
