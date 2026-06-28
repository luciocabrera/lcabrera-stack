import { styles } from '../AppNavigation.stylex';

/**
 * Returns the StyleX style that sizes the brand icon box to match the button
 * height for the current density setting.
 */
export const getBrandIconSizeStyle = (
  brandIconBoxSize: 'md' | 'mini' | 'sm',
) => {
  if (brandIconBoxSize === 'mini') {
    return styles.brandIconSizeMini;
  }

  if (brandIconBoxSize === 'md') {
    return styles.brandIconSizeMd;
  }

  return styles.brandIconSizeSm;
};
