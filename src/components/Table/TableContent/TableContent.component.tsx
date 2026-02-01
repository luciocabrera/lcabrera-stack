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

export const TableContent = <TData extends Record<string, unknown>, TResponse>({
  actions,
  icon,
  onLoadMore,
}: TableContentProps<TData, TResponse>) => {
  useRenderTracker('TableContent');

  const {
    containerRef,
    isSettingsOpen,
    isSettingsPinned,
    setIsSettingsOpen,
    setIsSettingsPinned,
  } = useTableContent<TData, TResponse>({
    onLoadMore,
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
        />
        <div ref={containerRef} {...stylex.props(styles.container)}>
          <TableBase>
            <TableHeader  />
            <TableBody  tableContainerRef={containerRef} />
          </TableBase>
        </div>
      </div>

      <TableSettingsDrawer
        isOpen={isSettingsOpen}
        isPinned={isSettingsPinned}
        onClose={handleCloseSettings}
        onPinChange={setIsSettingsPinned}
      />
    </div>
  );
};
