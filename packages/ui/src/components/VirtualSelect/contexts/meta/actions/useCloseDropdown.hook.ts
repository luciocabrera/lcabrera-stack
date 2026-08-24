import { useVirtualSelectContextValue } from '../../useVirtualSelectContextValue.hook';

/**
 * Distinct from `useToggleDropdown` because a toggle is suppressed while the list is busy,
 * so a dismissal expressed as a toggle silently does nothing over a loading list.
 */
export const useCloseDropdown = () => {
  const { onCloseDropdown } = useVirtualSelectContextValue();

  return onCloseDropdown;
};
