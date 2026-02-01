import { useEffect, useRef, useState } from 'react';

import { useInfiniteScroll } from '@/components/Table/hooks';
import { useGetColumnSizing } from '@/components/Table/TableContext/hooks/store/columns/selectors';
import {
  useGetTablePersistencyKey,
  useGetTableThreshold,
} from '@/components/Table/TableContext/hooks/store/meta/selectors';
import { writeStateSlice } from '@/components/Table/utils';

import type { TableContentProps } from '../TableContent.types';

type UseTableContentArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = Pick<TableContentProps<TData, TResponse>, 'onLoadMore'>;

export const useTableContent = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  onLoadMore,
}: UseTableContentArgs<TData, TResponse>) => {
  const columnSizing = useGetColumnSizing();
  const persistenceKey = useGetTablePersistencyKey();
  const threshold = useGetTableThreshold();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsPinned, setIsSettingsPinned] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up infinite scroll if configured
  useInfiniteScroll({
    onLoadMore,
    scrollContainerRef: containerRef,
    threshold,
  });

  // Debounced persistence for column sizing (cookies only, not in URL)
  useEffect(() => {
    if (!persistenceKey) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      writeStateSlice({
        persistenceKey,
        slice: 'columnSizing',
        storageType: 'cookie',
        value: columnSizing,
      });
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [columnSizing, persistenceKey]);

  return {
    containerRef,
    isSettingsOpen,
    isSettingsPinned,
    setIsSettingsOpen,
    setIsSettingsPinned,
  };
};
