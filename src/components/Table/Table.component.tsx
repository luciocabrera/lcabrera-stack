import * as stylex from '@stylexjs/stylex';

import type { TableProps } from './Table.types';

import { DEFAULT_ROW_HEIGHT } from './Table.constants';
import { styles } from './Table.stylex';
import { TableContent } from './TableContent';
import { TableProvider } from './TableContext';

export const Table = <T extends Record<string, unknown>>({
  actions,
  columns,
  columnSizing: initialColumnSizing,
  data,
  density = 'compact',
  icon,
  infiniteScrollConfig,
  initialColumnOrder,
  initialColumnVisibility,
  initialMeta,
  initialSorting,
  isBordered = false,
  isClientSortingEnabled = false,
  isFlexWrapperEnabled = true,
  isLoading = false,
  isStriped = false,
  locale,
  onFilterChange,
  onSortChange,
  overscan = 6,
  persistenceKey,
  rowHeight = DEFAULT_ROW_HEIGHT,
  title,
}: TableProps<T>) => {
   
  const tableContent = (
     
    <TableProvider<T>
      initialColumnOrder={initialColumnOrder}
      initialColumnSizing={initialColumnSizing}
      initialColumnVisibility={initialColumnVisibility}
      initialData={data}
      initialMeta={initialMeta}
      initialSorting={initialSorting}
      persistenceKey={persistenceKey}
    >
      <TableContent
        actions={actions}
        columns={columns}
        data={data}
        density={density}
        icon={icon}
        infiniteScrollConfig={infiniteScrollConfig}
        isBordered={isBordered}
        isClientSortingEnabled={isClientSortingEnabled}
        isLoading={isLoading}
        isStriped={isStriped}
        locale={locale}
        onFilterChange={onFilterChange}
        onSortChange={onSortChange}
        overscan={overscan}
        persistenceKey={persistenceKey}
        rowHeight={rowHeight}
        title={title}
      />
    </TableProvider>
  );

  if (isFlexWrapperEnabled)
    return <div {...stylex.props(styles.wrapper)}>{tableContent}</div>;

  return tableContent;
};
