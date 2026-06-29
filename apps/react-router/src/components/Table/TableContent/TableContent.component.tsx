import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';

import type { TableContentProps } from './TableContent.types';

import { useToogleTableIsTableSettingsOpen } from '../contexts/TableConfig/meta/actions';
import { useGetTableThreshold } from '../contexts/TableConfig/meta/selectors';
import { useFetchMoreData } from '../contexts/TableData/data/actions';
import {
  useGetTableHasMore,
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';
import { TableWrapperContext } from '../contexts/TableWrapper/TableWrapperContext.context';
import { useInfiniteScroll } from '../hooks';
import { TableBase } from '../TableBase';
import { TableBody } from '../TableBody';
import { TableDrawersSection } from '../TableDrawersSection';
import { TableHeader } from '../TableHeader';
import { TableTitle } from '../TableTitle';
import { styles } from './TableContent.stylex';

export const TableContent = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataSelector,
  dataTotalSelector,
  icon,
  onLoadMore,
}: TableContentProps<TData, TResponse>) => {
  const threshold = useGetTableThreshold();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const hasMore = useGetTableHasMore();

  const fetchMoreData = useFetchMoreData<TData, TResponse>();
  const toggleTableIsTableSettingsOpen = useToogleTableIsTableSettingsOpen();

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wasLoadingRef = useRef(isLoading);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperContextValue = { containerRef, wrapperRef };

  useEffect(() => {
    const wasLoading = wasLoadingRef.current;

    if (wasLoading && !isLoading && !isLoadingMore) {
      containerRef.current?.scrollTo({
        behavior: 'auto',
        left: 0,
        top: 0,
      });
    }

    wasLoadingRef.current = isLoading;
  }, [isLoading, isLoadingMore]);

  useInfiniteScroll({
    dataSelector,
    dataTotalSelector,
    fetchMoreData,
    hasMore,
    isLoadingMore,
    onLoadMore,
    scrollContainerRef: containerRef,
    sentinelRef,
    threshold,
  });

  return (
    <TableWrapperContext value={wrapperContextValue}>
      <div ref={wrapperRef} {...stylex.props(styles.wrapper)}>
        <div {...stylex.props(styles.outerContainer)}>
          <TableTitle
            actions={
              <>
                {actions}
                <Button
                  aria-label='Table settings'
                  color='ghost'
                  icon={<SettingsIcon size={16} />}
                  isBusy={isLoading}
                  onClick={toggleTableIsTableSettingsOpen}
                  size='mini'
                />
              </>
            }
            icon={icon}
          />
          <div
            data-scroll-locked={String(isLoading)}
            ref={containerRef}
            {...stylex.props(
              styles.container,
              isLoading && styles.containerLocked,
            )}
          >
            <TableBase>
              <TableHeader />
              <TableBody tableContainerRef={containerRef} />
            </TableBase>
            <div aria-hidden ref={sentinelRef} />
          </div>
        </div>
        <TableDrawersSection />
      </div>
    </TableWrapperContext>
  );
};
