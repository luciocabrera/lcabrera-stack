import * as stylex from '@stylexjs/stylex';

import { styles } from '../TableActionsPopover.stylex';

export const TableActionsPopoverSeparator = () => (
  <hr {...stylex.props(styles.menuSeparator)} />
);
