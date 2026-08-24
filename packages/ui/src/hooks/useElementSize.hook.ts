import type { RefObject } from 'react';

import { useState } from 'react';

import { useResizeObserver } from './useResizeObserver.hook';

type ElementSize = {
  readonly height: number;
  readonly width: number;
};

type UseElementSizeArgs = {
  readonly ref: RefObject<HTMLElement | null | undefined>;
};

const INITIAL_SIZE: ElementSize = { height: 0, width: 0 };

export const useElementSize = ({ ref }: UseElementSizeArgs) => {
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
