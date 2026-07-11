import { describe, expect, it } from 'vitest';

import { styles } from '../Toolbar.stylex';
import { getCompactItemStyle } from './getCompactItemStyle.util';

describe('getCompactItemStyle', () => {
  it('maps every design-system size to its compact item style', () => {
    expect(getCompactItemStyle('embedded')).toBe(
      styles.toolbarItemCompactEmbedded,
    );
    expect(getCompactItemStyle('lg')).toBe(styles.toolbarItemCompactLg);
    expect(getCompactItemStyle('md')).toBe(styles.toolbarItemCompactMd);
    expect(getCompactItemStyle('mini')).toBe(styles.toolbarItemCompactMini);
    expect(getCompactItemStyle('sm')).toBe(styles.toolbarItemCompactSm);
  });
});
