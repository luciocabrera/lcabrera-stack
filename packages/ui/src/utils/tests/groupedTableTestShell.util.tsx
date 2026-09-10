/**
 * Provider + scroll-container shell every grouped Table suite mounts, so a
 * grouping-state seed is not copied into each file.
 */

import type { ReactNode } from 'react';

import { useRef } from 'react';

import type {
  TableColumn,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { useSyncColumnAxisColumns } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
import { TableBase } from '#ui/components/Table/TableBase';
import { TableBody } from '#ui/components/Table/TableBody';

import { attachScrollMetrics } from './attachScrollMetrics.util';

type GroupedTableTestShellProps<TData extends Record<string, unknown>> = {
  readonly children?: ReactNode;
  readonly columns: TableColumn<TData>[];
  readonly containerHeight?: number;
  readonly data: readonly TData[];
  readonly groupingState?: Partial<TableGroupingState>;
  readonly header?: ReactNode;
  readonly metaState?: Partial<TableMetaState>;
  readonly toolbar?: ReactNode;
};

const SyncColumnAxisColumns = () => {
  useSyncColumnAxisColumns();
  return;
};

export const GroupedTableTestShell = <TData extends Record<string, unknown>>({
  children,
  columns,
  containerHeight = 400,
  data,
  groupingState,
  header,
  metaState,
  toolbar,
}: GroupedTableTestShellProps<TData>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setContainer = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    attachScrollMetrics({
      container: node ?? undefined,
      height: containerHeight,
    });
  };

  return (
    <TableConfigProvider<TData>
      columnsState={{ columns }}
      groupingState={groupingState}
      metaState={{
        overscan: 2,
        rowHeight: 40,
        ...metaState,
      }}
    >
      <TableFocusProvider>
        <TableDataProvider<TData>
          dataState={{
            data,
            isLoading: false,
            isLoadingMore: false,
            totalRows: data.length,
          }}
        >
          <SyncColumnAxisColumns />
          <TableWrapperContext value={{ containerRef, wrapperRef }}>
            {toolbar}
            <div data-testid='scroll-container' ref={setContainer}>
              <TableBase>
                {header}
                <TableBody tableContainerRef={containerRef} />
              </TableBase>
            </div>
            {children}
          </TableWrapperContext>
        </TableDataProvider>
      </TableFocusProvider>
    </TableConfigProvider>
  );
};
