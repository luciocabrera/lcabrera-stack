import { useVirtualSelectContextValue } from '../../useVirtualSelectContextValue.hook';

export const useToggleDropdown = () => {
  const { onToggleDropdown } = useVirtualSelectContextValue();

  return onToggleDropdown;
};
