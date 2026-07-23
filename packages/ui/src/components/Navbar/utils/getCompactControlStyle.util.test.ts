import { describe, expect, it } from 'vite-plus/test';

import { styles } from '../Navbar.stylex';
import { getCompactControlStyle } from './getCompactControlStyle.util';

describe('getCompactControlStyle', () => {
  it('maps every design-system size to its compact control style', () => {
    expect(getCompactControlStyle('embedded')).toBe(
      styles.compactControlEmbedded,
    );
    expect(getCompactControlStyle('lg')).toBe(styles.compactControlLg);
    expect(getCompactControlStyle('md')).toBe(styles.compactControlMd);
    expect(getCompactControlStyle('mini')).toBe(styles.compactControlMini);
    expect(getCompactControlStyle('sm')).toBe(styles.compactControlSm);
  });
});
