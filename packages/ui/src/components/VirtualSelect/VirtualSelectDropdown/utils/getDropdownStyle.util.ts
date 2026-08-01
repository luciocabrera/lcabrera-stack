import { styles } from '../VirtualSelectDropdown.stylex';

type GetDropdownStyleArgs = {
  readonly isAlwaysOpen: boolean | undefined;
  readonly shouldFillHeight: boolean;
};

export const getDropdownStyle = ({
  isAlwaysOpen,
  shouldFillHeight,
}: GetDropdownStyleArgs) => {
  if (!isAlwaysOpen) return styles.dropdownFloating;
  return shouldFillHeight ? styles.dropdownStaticFill : styles.dropdownStatic;
};
