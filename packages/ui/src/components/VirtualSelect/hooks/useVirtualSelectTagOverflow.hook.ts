import type { RefObject } from 'react';

import { useEffect, useState } from 'react';

import type { VirtualSelectMode } from '../VirtualSelect.types';

import { countVisibleTags } from '../utils';

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
  const [measurement, setMeasurement] = useState({
    count: selected.length,
    selected,
  });

  if (measurement.selected !== selected) {
    setMeasurement({ count: selected.length, selected });
  }

  useEffect(() => {
    const trigger = triggerRef.current;
    if (mode !== 'multi' || !trigger) return;

    const measure = () => {
      const count = countVisibleTags({ totalCount: selected.length, trigger });

      setMeasurement({ count, selected });
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(trigger);

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(trigger, { childList: true });

    let isMeasureCancelled = false;
    queueMicrotask(() => {
      if (!isMeasureCancelled) measure();
    });

    return () => {
      isMeasureCancelled = true;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [mode, selected, triggerRef]);

  return measurement.count;
};
