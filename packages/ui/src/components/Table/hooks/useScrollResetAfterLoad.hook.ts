import type { RefObject } from 'react';

import { useEffect, useRef } from 'react';

import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';

type UseScrollResetAfterLoadArgs = {
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
};

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
