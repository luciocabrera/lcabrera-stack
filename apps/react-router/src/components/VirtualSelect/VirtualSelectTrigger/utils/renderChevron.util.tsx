import * as stylex from '@stylexjs/stylex';

import { styles } from '../VirtualSelectTrigger.stylex';

export const renderChevron = (isAlwaysOpen: boolean, isOpen: boolean) => {
  if (isAlwaysOpen) {
    return undefined;
  }

  return <span data-chevron {...stylex.props(styles.chevron(isOpen))} />;
};
