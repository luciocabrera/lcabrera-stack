import { styles } from '../VirtualSelectDropdown.stylex';

type GetDropdownStyleArgs = {
  readonly isAlwaysOpen: boolean | undefined;
  readonly shouldFillHeight: boolean;
};

/**
 * The dropdown's **positioning** style only. It composes after the consumer's
 * `customStylex`, so nothing returned here is overridable — the floating
 * variant's surface styling lives in `dropdownFloatingSurface`, which composes
 * before it and is meant to be overridable.
 */
export const getDropdownStyle = ({
  isAlwaysOpen,
  shouldFillHeight,
}: GetDropdownStyleArgs) => {
  if (!isAlwaysOpen) return styles.dropdownFloatingPosition;
  return shouldFillHeight ? styles.dropdownStaticFill : styles.dropdownStatic;
};
