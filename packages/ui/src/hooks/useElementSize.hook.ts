import type { RefObject } from 'react';

import { useState } from 'react';

import { useResizeObserver } from './useResizeObserver.hook';

export type ElementSize = {
  readonly height: number;
  readonly width: number;
};

type UseElementSizeArgs = {
  readonly ref: RefObject<HTMLElement | null | undefined>;
};

const INITIAL_SIZE: ElementSize = { height: 0, width: 0 };

/**
 * Tracks the client (content-box, scrollbar-excluded) size of a referenced
 * element via `ResizeObserver`. SSR-safe: returns `{ height: 0, width: 0 }`
 * until the element is measured on the client.
 */
export const useElementSize = ({ ref }: UseElementSizeArgs): ElementSize => {
  const [size, setSize] = useState<ElementSize>(INITIAL_SIZE);

  const getTarget = () => ref.current;
  const onMeasure = (element: HTMLElement) => {
    const height = element.clientHeight;
    const width = element.clientWidth;

    setSize((previous) =>
      previous.height === height && previous.width === width
        ? previous
        : { height, width },
    );
  };

  useResizeObserver({ getTarget, onMeasure });

  return size;
};
