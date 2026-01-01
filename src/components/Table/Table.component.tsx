import * as stylex from '@stylexjs/stylex';
import { use, useEffect, useRef } from 'react';

import type { TableProps } from './Table.types';

import { useTablePersistence } from './hooks';
import { styles } from './Table.stylex';
import { TableBase } from './TableBase';
import { TableBody } from './TableBody';
import { TableContext, TableProvider, useColumnSizing } from './TableContext';
import { TableHeader } from './TableHeader';

const TableContent = <T extends Record<string, unknown>>({
  columns,
  data,
  density = 'compact',
  isBordered = false,
  isLoading = false,
  isStriped = false,
  locale,
  overscan = 6,
  persistenceKey,
  rowHeight = 32,
}: Omit<TableProps<T>, 'isFlexWrapperEnabled'>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const context = use(TableContext);
  const tableStore = context?.tableStore;
  const [columnSizing] = useColumnSizing<T>();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up persistence if persistenceKey provided
  const { persistSlice } = useTablePersistence({
    config: {
      columnSizing: persistenceKey ? 'localStorage' : undefined,
    },
    getState: () => tableStore?.get() ?? {},
    persistenceKey: persistenceKey ?? 'default-table',
    restoreState: (state) => {
      tableStore?.set(state);
    },
  });

  // Debounced persistence for column sizing
  useEffect(() => {
    if (!persistenceKey) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      persistSlice('columnSizing');
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [columnSizing, persistSlice, persistenceKey]);

  return (
    <div ref={containerRef} {...stylex.props(styles.container)}>
      {/* <TableOverlay isVisible={isLoading && data.length > 0} /> */}
      <TableBase density={density} isBordered={isBordered} isStriped={isStriped}>
        <TableHeader columns={columns} isLoading={isLoading} />
        <TableBody
          columns={columns}
          data={data}
          isLoading={isLoading}
          locale={locale}
          overscan={overscan}
          rowHeight={rowHeight}
          tableContainerRef={containerRef}
        />
      </TableBase>
    </div>
  );
};

export const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  density = 'compact',
  isBordered = false,
  isFlexWrapperEnabled = true,
  isLoading = false,
  isStriped = false,
  locale,
  overscan = 6,
  persistenceKey,
  rowHeight = 32,
}: TableProps<T>) => {
  const tableContent = (
    <TableProvider<T> initialData={data} persistenceKey={persistenceKey}>
      <TableContent
        columns={columns}
        data={data}
        density={density}
        isBordered={isBordered}
        isLoading={isLoading}
        isStriped={isStriped}
        locale={locale}
        overscan={overscan}
        persistenceKey={persistenceKey}
        rowHeight={rowHeight}
      />
    </TableProvider>
  );

  if (isFlexWrapperEnabled)
    return <div {...stylex.props(styles.wrapper)}>{tableContent}</div>;

  return tableContent;
};
