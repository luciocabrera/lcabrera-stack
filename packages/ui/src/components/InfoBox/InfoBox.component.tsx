import * as stylex from '@stylexjs/stylex';

import type { InfoBoxProps } from './InfoBox.types';

import { styles } from './InfoBox.stylex';

export const InfoBox = ({ children }: InfoBoxProps) => {
  return <div {...stylex.props(styles.container)}>{children}</div>;
};
