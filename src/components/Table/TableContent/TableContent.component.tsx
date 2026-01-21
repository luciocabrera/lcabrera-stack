import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';
import { TableSettingsDrawer } from '@/components/TableSettingsDrawer';

import type { TableContentProps } from './TableContent.types';

import { TableBase } from '../TableBase';
import { TableBody } from '../TableBody';
import { TableHeader } from '../TableHeader';
import { TableTitle } from '../TableTitle';
import { useTableContent } from './hooks';
import { styles } from './TableContent.stylex';

export const TableContent = <T extends Record<string, unknown>>({
  actions,
  columns,
  data,
  density = 'compact',
  icon,
  infiniteScrollConfig,
  initialColumnFilters,
  isBordered = false,
  isClientSortingEnabled = false,
  isLoading = false,
  isStriped = false,
  locale,
  onFilterChange,
  onSortChange,
  overscan = 6,
  persistenceKey,
  rowHeight = 32,
  title,
}: TableContentProps<T>) => {
  const {
    columnFilters,
    columnOrder,
    columnSizing,
    columnVisibility,
    containerRef,
    dataToRender,
    isLoadingMore,
    isSettingsOpen,
    isSettingsPinned,
    setColumnFilters,
    setColumnOrder,
    setColumnSizing,
    setColumnVisibility,
    setIsSettingsOpen,
    setIsSettingsPinned,
    setSorting,
    sorting,
  } = useTableContent({
    columns,
    data,
    infiniteScrollConfig,
    initialColumnFilters,
    isClientSortingEnabled,
    onFilterChange,
    onSortChange,
    persistenceKey,
  });

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };
  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  return (
    <div {...stylex.props(styles.wrapper)}>
      <div {...stylex.props(styles.outerContainer)}>
        <TableTitle
          actions={
            <>
              {actions}
              <Button
                aria-label='Table settings'
                color='ghost'
                icon={<SettingsIcon size={16} />}
                onClick={handleOpenSettings}
                size='mini'
              />
            </>
          }
          icon={icon}
          title={title}
        />
        <div ref={containerRef} {...stylex.props(styles.container)}>
          <TableBase
            density={density}
            isBordered={isBordered}
            isStriped={isStriped}
          >
            <TableHeader
              columns={columns}
              data={dataToRender}
              isLoading={isLoading || isLoadingMore}
            />
            <TableBody
              columns={columns}
              data={dataToRender}
              isLoading={isLoading || isLoadingMore}
              locale={locale}
              overscan={overscan}
              rowHeight={rowHeight}
              tableContainerRef={containerRef}
            />
          </TableBase>
        </div>
      </div>

      <TableSettingsDrawer
        columnFilters={columnFilters}
        columnOrder={columnOrder}
        columns={columns}
        columnSizing={columnSizing}
        columnVisibility={columnVisibility}
        isOpen={isSettingsOpen}
        isPinned={isSettingsPinned}
        onClose={handleCloseSettings}
        onColumnFiltersChange={setColumnFilters}
        onColumnOrderChange={setColumnOrder}
        onColumnSizingChange={setColumnSizing}
        onColumnVisibilityChange={setColumnVisibility}
        onPinChange={setIsSettingsPinned}
        onSortingChange={setSorting}
        sorting={sorting}
      />
    </div>
  );
};
