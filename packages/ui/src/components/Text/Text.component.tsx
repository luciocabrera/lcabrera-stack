import * as stylex from '@stylexjs/stylex';

import type { TextProps } from './Text.types';

import { styles } from './Text.stylex';

export const Text = ({
  as: Element = 'p',
  children,
  customStylex,
  isMono = false,
  isTabular = false,
  size = 'md',
  tone = 'primary',
  weight,
}: TextProps) => (
  <Element
    {...stylex.props(
      styles.text,
      styles.size[size],
      styles.tone[tone],
      weight && styles.weight[weight],
      isMono && styles.mono,
      isTabular && styles.tabular,
      customStylex,
    )}
  >
    {children}
  </Element>
);
