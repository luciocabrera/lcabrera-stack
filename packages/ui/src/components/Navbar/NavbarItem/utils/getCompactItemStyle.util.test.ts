import { describe, expect, it } from 'vite-plus/test';

import { styles } from '../NavbarItem.stylex';
import { getCompactItemStyle } from './getCompactItemStyle.util';

describe('getCompactItemStyle', () => {
  it('maps every design-system size to its compact item style', () => {
    expect(getCompactItemStyle('embedded')).toBe(
      styles.navbarItemCompactEmbedded,
    );
    expect(getCompactItemStyle('lg')).toBe(styles.navbarItemCompactLg);
    expect(getCompactItemStyle('md')).toBe(styles.navbarItemCompactMd);
    expect(getCompactItemStyle('mini')).toBe(styles.navbarItemCompactMini);
    expect(getCompactItemStyle('sm')).toBe(styles.navbarItemCompactSm);
  });
});
