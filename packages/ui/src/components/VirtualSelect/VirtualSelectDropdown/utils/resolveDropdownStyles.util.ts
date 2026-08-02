import type { StyleXStyles } from '@stylexjs/stylex';

import type { DropdownPlacement } from '../VirtualSelectDropdown.types';

import { styles } from '../VirtualSelectDropdown.stylex';
import { getDropdownStyle } from './getDropdownStyle.util';

type ResolveDropdownStylesArgs = {
  readonly customStylex: StyleXStyles | undefined;
  readonly isAlwaysOpen: boolean | undefined;
  readonly isFloating: boolean;
  readonly placement: DropdownPlacement | undefined;
  readonly shouldFillHeight: boolean;
};

/**
 * The dropdown's whole style chain, in order, for spreading into
 * `stylex.props`.
 *
 * The consumer's `customStylex` splits the chain, and which side each style
 * falls on is load-bearing. StyleX is last-wins, so everything before it is
 * overridable and everything after it is not — and the consumer must not be
 * able to move the list: a popover that is not absolutely positioned still sits
 * in the top layer, where it lays out against the initial containing block,
 * i.e. the viewport's top-left corner, detached from its trigger. Surface
 * styling therefore goes above the split and positioning below it.
 */
export const resolveDropdownStyles = ({
  customStylex,
  isAlwaysOpen,
  isFloating,
  placement,
  shouldFillHeight,
}: ResolveDropdownStylesArgs) => [
  styles.dropdownBase,
  isFloating && styles.dropdownFloatingSurface,
  customStylex,
  getDropdownStyle({ isAlwaysOpen, shouldFillHeight }),
  isFloating && placement === undefined && styles.dropdownUnplaced,
  isFloating &&
    placement !== undefined &&
    styles.dropdownAt(placement.left, placement.top, placement.width),
];
