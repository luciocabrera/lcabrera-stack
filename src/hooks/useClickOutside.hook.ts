import type { RefObject } from 'react';

import { useEffect } from 'react';

type UseClickOutsideArgs = {
  onClickOutside: () => void;
  ref: RefObject<HTMLElement | null>;
};

/**
 * Calls `onClickOutside` when a mousedown occurs outside the referenced element.
 */
export const useClickOutside = ({
  onClickOutside,
  ref,
}: UseClickOutsideArgs): void => {
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onClickOutside, ref]);
};
