import type { FocusEvent, KeyboardEvent } from 'react';

import { useState } from 'react';

import type { HeatmapLinkedCell } from '#ui/components/Heatmap/Heatmap.types';

import { HEATMAP } from '#ui/components/Heatmap/Heatmap.constants';
import { resolveHeatmapFocusMove } from '#ui/components/Heatmap/utils/resolveHeatmapFocusMove.util';

type UseHeatmapRovingFocusArgs = {
  readonly firstLinked: HeatmapLinkedCell;
  readonly linked: readonly HeatmapLinkedCell[];
};

export const useHeatmapRovingFocus = ({
  firstLinked,
  linked,
}: UseHeatmapRovingFocusArgs) => {
  const [focusedKey, setFocusedKey] = useState<string>();
  const tabStop = linked.find(({ key }) => key === focusedKey) ?? firstLinked;

  const handleFocus = (event: FocusEvent<HTMLTableElement>) => {
    const key = event.target.getAttribute(HEATMAP.cellAttribute);

    if (key !== null) setFocusedKey(key);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    if (event.altKey) return;

    const next = resolveHeatmapFocusMove({
      current: tabStop,
      isRangeModifier: event.ctrlKey || event.metaKey,
      key: event.key,
      linked,
    });

    if (next === undefined) return;

    event.preventDefault();

    for (const link of event.currentTarget.querySelectorAll('a')) {
      if (link.getAttribute(HEATMAP.cellAttribute) === next.key) link.focus();
    }
  };

  return {
    gridProps: {
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
      role: HEATMAP.gridRole,
    },
    tabStop,
  };
};
