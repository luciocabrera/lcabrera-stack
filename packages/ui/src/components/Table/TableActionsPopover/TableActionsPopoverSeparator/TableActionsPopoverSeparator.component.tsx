import * as stylex from '@stylexjs/stylex';

import { styles } from '../TableActionsPopover.stylex';

/**
 * Section rule between two groups of items in a table actions popover.
 *
 * A standalone flex child of `menuActions` rather than a `border-top` on the
 * first item of the next section: the container's `gap` then applies equally
 * above and below the rule, so the spacing is symmetric by construction instead
 * of by two numbers that have to be kept in agreement. It also keeps the rule
 * off the items themselves, whose ghost-button hover background would otherwise
 * paint right up to it.
 *
 * `<hr>`, not a `div` carrying `role='separator'`: the role is the element's
 * own, and ARIA treats a standalone `separator` as a focusable splitter that
 * needs `aria-valuenow` — which this is not.
 */
export const TableActionsPopoverSeparator = () => (
  <hr {...stylex.props(styles.menuSeparator)} />
);
