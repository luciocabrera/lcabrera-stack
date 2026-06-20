import * as stylex from '@stylexjs/stylex';

import { styles } from '../VirtualSelectTrigger.stylex';

type RenderChevronArgs = {
  readonly isAlwaysOpen: boolean;
  readonly isOpen: boolean;
};

export const renderChevron = ({ isAlwaysOpen, isOpen }: RenderChevronArgs) => {
  if (isAlwaysOpen) return;

  return <span data-chevron {...stylex.props(styles.chevron(isOpen))} />;
};
