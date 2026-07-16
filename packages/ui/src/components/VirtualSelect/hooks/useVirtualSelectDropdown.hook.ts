import { useEffect, useState } from 'react';

export type UseVirtualSelectDropdownArgs = {
  readonly isAlwaysOpen: boolean;
  readonly isBusy: boolean;
  readonly onOpenChange?: (isOpen: boolean) => void;
};

export const useVirtualSelectDropdown = ({
  isAlwaysOpen,
  isBusy,
  onOpenChange,
}: UseVirtualSelectDropdownArgs) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (isBusy) return;
    setIsOpen((isCurrentlyOpen) => !isCurrentlyOpen);
  };

  return {
    closeDropdown,
    isListVisible: isAlwaysOpen || isOpen,
    isOpen,
    toggleDropdown,
  };
};
