import * as stylex from '@stylexjs/stylex';

import type { InfoBoxProps } from './InfoBox.types';

import { styles } from './InfoBox.stylex';

/**
 * A styled container for informational messages.
 * Used for hints, empty states, and contextual information.
 */
export const InfoBox = ({ children }: InfoBoxProps) => {
  return <div {...stylex.props(styles.container)}>{children}</div>;
};

InfoBox.displayName = 'InfoBox';
