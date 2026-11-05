import { describe, expect, it } from 'vite-plus/test';

import { readThemeColors } from './readThemeColors.util';

describe('readThemeColors', () => {
  it('lists the oklch and lab tokens of each theme', () => {
    expect(readThemeColors('light')).toContainEqual({
      name: 'textPrimary',
      value: 'lab(12 34.23 -54.75 / 0.76)',
    });
    expect(readThemeColors('dark')).toContainEqual({
      name: 'textPrimary',
      value: 'oklch(92% 0.01 250)',
    });
  });

  it('skips a relative colour, a hex value and a commented-out line', () => {
    const names = readThemeColors('light').map(({ name }) => name);

    expect(names).not.toContain('brandPrimaryHover');
    expect(names).not.toContain('glassBackgroundColorPrimary');
    expect(names.filter((name) => name === 'brandSecondary')).toHaveLength(1);
  });
});
