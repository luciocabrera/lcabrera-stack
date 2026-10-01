import * as stylex from '@stylexjs/stylex';

import type { TableContentProps } from './TableContent.types';

import { TableWrapperContext } from '../contexts/TableWrapper/TableWrapperContext.context';
import { TableBase } from '../TableBase';
import { TableBody } from '../TableBody';
import { TableDrawersSection } from '../TableDrawersSection';
import { TableHeader } from '../TableHeader';
import { TableTitle } from '../TableTitle';
import { styles } from './TableContent.stylex';
import { TableTitleActions } from './TableTitleActions/TableTitleActions.component';
import { useTableContentRuntime } from './useTableContentRuntime.hook';

export const TableContent = <TData extends Record<string, unknown>, TResponse>({
  actions,
  dataSelector,
  dataTotalSelector,
  icon,
  onLoadMore,
}: TableContentProps<TData, TResponse>) => {
  const { containerRef, isLoading, isRounded, sentinelRef, wrapperRef } =
    useTableContentRuntime<TData, TResponse>({
      dataSelector,
      dataTotalSelector,
      onLoadMore,
    });
  const wrapperContextValue = { containerRef, wrapperRef };

  return (
    <TableWrapperContext value={wrapperContextValue}>
      <div ref={wrapperRef} {...stylex.props(styles.wrapper)}>
        <div
          data-rounded={String(isRounded)}
          {...stylex.props(styles.outerContainer, isRounded && styles.rounded)}
        >
          <TableTitle
            actions={<TableTitleActions actions={actions} />}
            icon={icon}
          />
          <div
            data-scroll-locked={String(isLoading)}
            ref={containerRef}
            {...stylex.props(
              styles.container,
              isLoading && styles.containerLocked,
            )}
            data-testid='table-scroll-container'
          >
            <TableBase>
              <TableHeader />
              <TableBody tableContainerRef={containerRef} />
            </TableBase>
            <div
              aria-hidden
              ref={sentinelRef}
              {...stylex.props(styles.sentinel)}
              data-testid='table-scroll-sentinel'
            />
          </div>
        </div>
        <TableDrawersSection />
      </div>
    </TableWrapperContext>
  );
};
