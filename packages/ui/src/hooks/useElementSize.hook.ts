import type { RefObject } from 'react';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const measure = () => {
      const height = element.clientHeight;
      const width = element.clientWidth;

      setSize((previous) =>
        previous.height === height && previous.width === width
          ? previous
          : { height, width },
      );
    };

    measure();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
};
