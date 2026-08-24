import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { TableContentProps } from './TableContent.types';

import {
  useGetTableIsRounded,
  useGetTableThreshold,
} from '../contexts/TableConfig/meta/selectors';
import { useFetchMoreData } from '../contexts/TableData/data/actions';
import {
  useGetTableHasMore,
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';
import { TableWrapperContext } from '../contexts/TableWrapper/TableWrapperContext.context';
import { useInfiniteScroll, useScrollResetAfterLoad } from '../hooks';
import { TableBase } from '../TableBase';
import { TableBody } from '../TableBody';
import { TableDrawersSection } from '../TableDrawersSection';
import { TableHeader } from '../TableHeader';
import { TableTitle } from '../TableTitle';
import { styles } from './TableContent.stylex';
import { TableTitleActions } from './TableTitleActions/TableTitleActions.component';

/**
 * Table layout shell: title bar, the scrollable table area with the infinite-scroll
 * sentinel, and the drawers section.
 */
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
  const isRounded = useGetTableIsRounded();
  const hasMore = useGetTableHasMore();

  const fetchMoreData = useFetchMoreData<TData, TResponse>();

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperContextValue = { containerRef, wrapperRef };

  useScrollResetAfterLoad({ scrollContainerRef: containerRef });

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
        <div
          data-rounded={String(isRounded)}
          {...stylex.props(styles.outerContainer, isRounded && styles.rounded)}
        >
          <TableTitle
            actions={<TableTitleActions actions={actions} />}
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
            <div
              aria-hidden
              ref={sentinelRef}
              {...stylex.props(styles.sentinel)}
            />
          </div>
        </div>
        <TableDrawersSection />
      </div>
    </TableWrapperContext>
  );
};
