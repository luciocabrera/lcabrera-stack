import { useVirtualSelectContextValue } from '../../useVirtualSelectContextValue.hook';

/**
 * Toggles the dropdown open state. The open state is shell-owned (mirrored
 * into the meta store), so the action dispatches the shell's callback from
 * the context value.
 */
export const useToggleDropdown = () => {
  const { onToggleDropdown } = useVirtualSelectContextValue();

  return onToggleDropdown;
};
