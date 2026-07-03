import { useEffect, useState, type RefObject } from 'react';

import { countVisibleTags } from '../utils';

import type { VirtualSelectMode } from '../VirtualSelect.types';

export type UseVirtualSelectTagOverflowArgs = {
  readonly mode: VirtualSelectMode;
  readonly selected: readonly string[];
  readonly triggerRef: RefObject<
    HTMLButtonElement | HTMLDivElement | undefined
  >;
};

export const useVirtualSelectTagOverflow = ({
  mode,
  selected,
  triggerRef,
}: UseVirtualSelectTagOverflowArgs) => {
  const [visibleTagCount, setVisibleTagCount] = useState(selected.length);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (mode !== 'multi' || !trigger) return;

    const measure = () => {
      setVisibleTagCount(
        countVisibleTags({ totalCount: selected.length, trigger }),
      );
    };

    const observer = new ResizeObserver(measure);
    observer.observe(trigger);

    // Initial measurement so tag count reflects current layout immediately.
    measure();

    return () => {
      observer.disconnect();
    };
  }, [mode, selected, triggerRef]);

  return visibleTagCount;
};
