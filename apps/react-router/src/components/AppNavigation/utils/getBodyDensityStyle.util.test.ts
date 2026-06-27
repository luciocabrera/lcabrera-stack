import { describe, expect, it } from 'vitest';

import { styles } from '../AppNavigation.stylex';
import { getBodyDensityStyle } from './getBodyDensityStyle.util';

describe('getBodyDensityStyle', () => {
  it('returns bodyDensityCompact for "compact"', () => {
    expect(getBodyDensityStyle('compact')).toBe(styles.bodyDensityCompact);
  });

  it('returns bodyDensityLarge for "large"', () => {
    expect(getBodyDensityStyle('large')).toBe(styles.bodyDensityLarge);
  });

  it('returns undefined for "medium" (default density)', () => {
    expect(getBodyDensityStyle('medium')).toBeUndefined();
  });

  it('returns undefined for "small"', () => {
    expect(getBodyDensityStyle('small')).toBeUndefined();
  });

  it('returns undefined when preference is undefined', () => {
    expect(getBodyDensityStyle(undefined)).toBeUndefined();
  });
});
