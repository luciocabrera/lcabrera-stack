import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';
import { useRenderTracker } from '@/utils/performance';

import type { TableContentProps } from './TableContent.types';

import { useToogleTableIsTableSettingsOpen } from '../contexts/TableConfig/meta/actions';
import { useGetTableThreshold } from '../contexts/TableConfig/meta/selectors';
import { useFetchMoreData } from '../contexts/TableData/data/actions';
import {
  useGetTableHasMore,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';
// import { TableWrapperContext } from '../contexts/TableWrapper/TableWrapperContext.context';
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
  useRenderTracker({ componentName: 'TableContent' });

  const threshold = useGetTableThreshold();
  const isLoadingMore = useGetTableIsLoadingMore();
  const hasMore = useGetTableHasMore();

  const fetchMoreData = useFetchMoreData<TData, TResponse>();

  const toogleTableIsTableSettingsOpen = useToogleTableIsTableSettingsOpen();

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // const wrapperContextValue = { containerRef, wrapperRef };

  useInfiniteScroll({
    dataSelector,
    dataTotalSelector,
    fetchMoreData,
    hasMore,
    isLoadingMore,
    onLoadMore,
    scrollContainerRef: containerRef,
    threshold,
  });

  return (
    // <TableWrapperContext value={wrapperContextValue}>
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
                onClick={toogleTableIsTableSettingsOpen}
                size='mini'
              />
            </>
          }
          icon={icon}
        />
        <div ref={containerRef} {...stylex.props(styles.container)}>
          <TableBase>
            <TableHeader />
            <TableBody tableContainerRef={containerRef} />
          </TableBase>
        </div>
      </div>
      <TableDrawersSection />
    </div>
    // </TableWrapperContext>
  );
};
