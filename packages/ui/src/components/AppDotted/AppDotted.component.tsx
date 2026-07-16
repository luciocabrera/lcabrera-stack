import * as stylex from '@stylexjs/stylex';

import type { AppDottedProps } from './AppDotted.types';

import { styles } from './AppDotted.stylex';

export const AppDotted = ({ children }: AppDottedProps) => {
  return <div {...stylex.props(styles.dottedWrapper)}>{children}</div>;
};
