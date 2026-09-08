/**
 * The painted width of the panel a splitter sits in, measured rather than
 * assumed. A panel opened before anyone has resized it carries no `width` of
 * its own — it paints from its `size` variant — so a gesture that started from
 * the band's floor would snap it narrower on the reader's first drag (ADR-114).
 */
import type { RefObject } from 'react';

import { useState } from 'react';

import { useResizeObserver } from '#ui/hooks/useResizeObserver.hook';

type UseSidePanelHostWidthArgs = {
  readonly ref: RefObject<HTMLElement | null>;
};

export const useSidePanelHostWidth = ({ ref }: UseSidePanelHostWidthArgs) => {
  const [hostWidth, setHostWidth] = useState(0);

  const getTarget = () => ref.current?.parentElement;
  const onMeasure = (element: HTMLElement) => {
    const measured = element.offsetWidth;

    setHostWidth((previous) => (previous === measured ? previous : measured));
  };

  useResizeObserver({ getTarget, onMeasure });

  return hostWidth;
};
