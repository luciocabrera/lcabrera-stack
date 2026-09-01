import { useVirtualSelectContextValue } from '../../useVirtualSelectContextValue.hook';

export const useCloseDropdown = () => {
  const { onCloseDropdown } = useVirtualSelectContextValue();

  return onCloseDropdown;
};
