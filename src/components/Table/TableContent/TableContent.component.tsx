import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';
import { TableSettingsDrawer } from '@/components/TableSettingsDrawer';
import { useRenderTracker } from '@/utils/performance';

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
  useRenderTracker('TableContent');

  const {
    containerRef,
    dataToRender,
    isLoadingMore,
    isSettingsOpen,
    isSettingsPinned,
    setIsSettingsOpen,
    setIsSettingsPinned,
  } = useTableContent({
    columns,
    data,
    infiniteScrollConfig,
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
        columns={columns}
        isOpen={isSettingsOpen}
        isPinned={isSettingsPinned}
        onClose={handleCloseSettings}
        onPinChange={setIsSettingsPinned}
      />
    </div>
  );
};
