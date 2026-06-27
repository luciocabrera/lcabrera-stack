import { describe, expect, it } from 'vitest';

import { styles } from '../AppNavigation.stylex';
import { getHeaderDensityStyle } from './getHeaderDensityStyle.util';

describe('getHeaderDensityStyle', () => {
  it('returns headerDensityCompact for "compact"', () => {
    expect(getHeaderDensityStyle('compact')).toBe(styles.headerDensityCompact);
  });

  it('returns headerDensitySmall for "small"', () => {
    expect(getHeaderDensityStyle('small')).toBe(styles.headerDensitySmall);
  });

  it('returns headerDensityLarge for "large"', () => {
    expect(getHeaderDensityStyle('large')).toBe(styles.headerDensityLarge);
  });

  it('returns undefined for "medium" (default density)', () => {
    expect(getHeaderDensityStyle('medium')).toBeUndefined();
  });

  it('returns undefined when preference is undefined', () => {
    expect(getHeaderDensityStyle(undefined)).toBeUndefined();
  });
});
