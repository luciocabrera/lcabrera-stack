import * as stylex from '@stylexjs/stylex';

import type { InfoBoxProps } from './InfoBox.types';

import { styles } from './InfoBox.stylex';

export const InfoBox = ({ tone = 'neutral', ...rest }: InfoBoxProps) => (
  <div {...rest} {...stylex.props(styles.container, styles.tone[tone])} />
);
