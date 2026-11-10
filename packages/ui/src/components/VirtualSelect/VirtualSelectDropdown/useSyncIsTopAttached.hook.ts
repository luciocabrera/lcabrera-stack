import { useEffect } from 'react';

import { useSetIsTopAttached } from '#ui/components/VirtualList/contexts/list/actions';

import type { DropdownPlacement } from './VirtualSelectDropdown.types';

type UseSyncIsTopAttachedArgs = {
  readonly isAlwaysOpen: boolean;
  readonly placement: DropdownPlacement | undefined;
};

export const useSyncIsTopAttached = ({
  isAlwaysOpen,
  placement,
}: UseSyncIsTopAttachedArgs) => {
  const setIsTopAttached = useSetIsTopAttached();
  const isTopAttached = isAlwaysOpen || placement?.side === 'below';

  useEffect(() => {
    setIsTopAttached(isTopAttached);
  }, [isTopAttached, setIsTopAttached]);
};
