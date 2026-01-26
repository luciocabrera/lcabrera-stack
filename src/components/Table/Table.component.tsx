import * as stylex from '@stylexjs/stylex';

import { useRenderTracker } from '@/utils/performance';

import type { TableProps } from './Table.types';

import { DEFAULT_ROW_HEIGHT } from './Table.constants';
import { styles } from './Table.stylex';
import { TableContent } from './TableContent';

/**
 * Table component - renders the table content.
 * 
 * NOTE: This component expects to be wrapped in a TableProvider!
 * When using TableLayout, the provider is already set up.
 * For standalone usage, wrap with TableProvider manually.
 */
export const Table = <T extends Record<string, unknown>>({
  actions,
  data,
  density = 'compact',
  icon,
  infiniteScrollConfig,
  isBordered = false,
  isClientSortingEnabled = false,
  isFlexWrapperEnabled = true,
  isLoading = false,
  isStriped = false,
  locale,
  overscan = 6,
  persistenceKey,
  rowHeight = DEFAULT_ROW_HEIGHT,
  title,

}: TableProps<T>) => {
  useRenderTracker('Table');

  const tableContent = (
    <TableContent
      actions={actions}
      data={data}
      density={density}
      icon={icon}
      infiniteScrollConfig={infiniteScrollConfig}
      isBordered={isBordered}
      isClientSortingEnabled={isClientSortingEnabled}
      isLoading={isLoading}
      isStriped={isStriped}
      locale={locale}
      overscan={overscan}
      persistenceKey={persistenceKey}
      rowHeight={rowHeight}
      title={title}
    />
  );

  if (isFlexWrapperEnabled)
    return <div {...stylex.props(styles.wrapper)}>{tableContent}</div>;

  return tableContent;
};
