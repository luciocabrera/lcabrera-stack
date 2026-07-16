import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';

type UseScrollResetAfterLoadArgs = {
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
};

/**
 * Scrolls the table container back to the origin when a full (non-load-more)
 * load finishes, so filter/sort refreshes always show the first rows. Owns
 * its store wiring: subscribes to the loading flags itself.
 */
export const useScrollResetAfterLoad = ({
  scrollContainerRef,
}: UseScrollResetAfterLoadArgs) => {
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const wasLoadingRef = useRef(isLoading);

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;

    if (wasLoading && !isLoading && !isLoadingMore) {
      scrollContainerRef.current?.scrollTo({
        behavior: 'auto',
        left: 0,
        top: 0,
      });
    }

    wasLoadingRef.current = isLoading;
  }, [isLoading, isLoadingMore, scrollContainerRef]);
};
