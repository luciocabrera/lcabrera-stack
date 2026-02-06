import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';
import { TableSettingsDrawer } from '@/components/Table/TableSettingsDrawer';
import { TableDrawerProvider } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';
import { useRenderTracker } from '@/utils/performance';

import type { TableContentProps } from './TableContent.types';

import { useInfiniteScroll } from '../hooks';
import { TableBase } from '../TableBase';
import { TableBody } from '../TableBody';
import { useGetTableThreshold } from '../TableContext/hooks/store/meta/selectors';
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

  const containerRef = useRef<HTMLDivElement>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useInfiniteScroll({
    dataSelector,
    dataTotalSelector,
    onLoadMore,
    scrollContainerRef: containerRef,
    threshold,
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
            <TableHeader />
            <TableBody tableContainerRef={containerRef} />
          </TableBase>
        </div>
      </div>
      <TableDrawerProvider>
        <TableSettingsDrawer
          isOpen={isSettingsOpen}
          onClose={handleCloseSettings}
        />
      </TableDrawerProvider>
    </div>
  );
};
