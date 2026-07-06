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

    // The initial measurement is deferred to a microtask so the effect body
    // never sets state synchronously (react-x/set-state-in-effect); with a
    // real ResizeObserver, `observe()` also delivers an initial callback.
    let isMeasureCancelled = false;
    queueMicrotask(() => {
      if (!isMeasureCancelled) measure();
    });

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        isMeasureCancelled = true;
      };
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => {
      isMeasureCancelled = true;
      observer.disconnect();
    };
  }, [ref]);

  return size;
};
