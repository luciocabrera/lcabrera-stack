import { Button } from '@repo/ui/components/Button';
import { SettingsIcon } from '@repo/ui/components/Icons';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { TableContentProps } from './TableContent.types';

import { useGetColumns } from '../contexts/TableConfig/columns/selectors';
import { useToogleTableIsTableSettingsOpen } from '../contexts/TableConfig/meta/actions';
import {
  useGetTableCrud,
  useGetTableDeleteActionPath,
  useGetTableThreshold,
  useGetTableTitleSingular,
} from '../contexts/TableConfig/meta/selectors';
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
import { TableCreateLink } from '../TableCreateLink';
import { TableDrawersSection } from '../TableDrawersSection';
import { TableHeader } from '../TableHeader';
import { TableTitle } from '../TableTitle';
import { validateTableCrudConfig } from '../utils/validateTableCrudConfig.util';
import { styles } from './TableContent.stylex';

export const TableContent = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataSelector,
  dataTotalSelector,
  emptyState,
  icon,
  onLoadMore,
}: TableContentProps<TData, TResponse>) => {
  const threshold = useGetTableThreshold();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const hasMore = useGetTableHasMore();
  const titleSingular = useGetTableTitleSingular();
  const crud = useGetTableCrud();
  const columns = useGetColumns<TData>();
  const deleteActionPath = useGetTableDeleteActionPath();

  const fetchMoreData = useFetchMoreData<TData, TResponse>();
  const toggleTableIsTableSettingsOpen = useToogleTableIsTableSettingsOpen();

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wasLoadingRef = useRef(isLoading);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperContextValue = { containerRef, wrapperRef };
  const resolvedTitleSingular = titleSingular ?? 'Record';

  validateTableCrudConfig({ columns, crud, deleteActionPath });

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
                {crud?.create && (
                  <TableCreateLink title={resolvedTitleSingular} to='new' />
                )}
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
              <TableBody
                emptyState={emptyState}
                tableContainerRef={containerRef}
              />
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
