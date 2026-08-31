import { useState } from 'react';

export type UseVirtualSelectDropdownArgs = {
  readonly isAlwaysOpen: boolean;
  readonly isInert: boolean;
  readonly onOpenChange?: (isOpen: boolean) => void;
};

export const useVirtualSelectDropdown = ({
  isAlwaysOpen,
  isInert,
  onOpenChange,
}: UseVirtualSelectDropdownArgs) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeDropdown = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const toggleDropdown = () => {
    if (isInert) return;
    const isNowOpen = !isOpen;

    setIsOpen(isNowOpen);
    onOpenChange?.(isNowOpen);
  };

  return {
    closeDropdown,
    isListVisible: isAlwaysOpen || isOpen,
    isOpen,
    toggleDropdown,
  };
};
