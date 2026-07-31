import { useState } from 'react';

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

  // The parent is notified from the handler that changes the state, not from an
  // effect. An effect ran a render late — the parent painted once with the
  // stale value before catching up — and it also fired on mount with `false`,
  // which no consumer asked for.
  const closeDropdown = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  const toggleDropdown = () => {
    if (isBusy) return;
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
