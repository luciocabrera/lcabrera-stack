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
 * The consumer's `customStylex` splits the chain, and which side each style falls on is
 * load-bearing.
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
