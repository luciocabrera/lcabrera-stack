import { styles } from '../AppNavigation.stylex';

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
