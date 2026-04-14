import { styles } from '../VirtualSelect.stylex';

export const getDropdownStyle = (
  isAlwaysOpen: boolean | undefined,
  shouldFillHeight: boolean,
) => {
  if (!isAlwaysOpen) return styles.dropdownAbsolute;
  return shouldFillHeight ? styles.dropdownStaticFill : styles.dropdownStatic;
};
