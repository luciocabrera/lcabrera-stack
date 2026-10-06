import { styles } from '../AppNavigation.stylex';

export const getBrandIconSizeStyle = (
  brandIconBoxSize: 'md' | 'mini' | 'sm',
) => {
  if (brandIconBoxSize === 'mini') {
    return styles.brandIconSizeMini;
  }

  return brandIconBoxSize === 'md'
    ? styles.brandIconSizeMd
    : styles.brandIconSizeSm;
};
