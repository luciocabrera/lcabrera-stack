import * as stylex from '@stylexjs/stylex';
import { use, useRef } from 'react';

import type { TableStaticContentProps } from './TableStaticContent.types';

import { useSyncColumnAxisColumns } from '../contexts/TableConfig/grouping/actions';
import { useGetTableIsRounded } from '../contexts/TableConfig/meta/selectors';
import { TablePresentationContext } from '../contexts/TableConfig/TablePresentationContext.context';
import { TableWrapperContext } from '../contexts/TableWrapper/TableWrapperContext.context';
import { TableBase } from '../TableBase';
import { TableTitleActions } from '../TableContent/TableTitleActions/TableTitleActions.component';
import { TableDrawersSection } from '../TableDrawersSection';
import { TableHeader } from '../TableHeader';
import { TableStaticBody } from '../TableStaticBody/TableStaticBody.component';
import { TableTitle } from '../TableTitle';
import { tableStaticContentStyles as styles } from './TableStaticContent.stylex';

export const TableStaticContent = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  actions,
  caption,
  customStylex,
  footer,
  icon,
  tableProps,
}: TableStaticContentProps<TData, TResponse>) => {
  const { features } = use(TablePresentationContext);
  const isRounded = useGetTableIsRounded();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useSyncColumnAxisColumns();

  return (
    <TableWrapperContext value={{ containerRef, wrapperRef }}>
      <div
        data-layout='static'
        ref={wrapperRef}
        {...stylex.props(styles.wrapper, isRounded && styles.rounded)}
      >
        {features.toolbar !== false && (
          <TableTitle
            actions={<TableTitleActions actions={actions} />}
            icon={icon}
          />
        )}
        <div
          data-testid='table-scroll-container'
          ref={containerRef}
          {...stylex.props(styles.container)}
        >
          <TableBase
            {...tableProps}
            caption={caption}
            customStylex={customStylex}
            footer={footer}
          >
            <TableHeader />
            <TableStaticBody />
          </TableBase>
        </div>
        {features.settings !== false && <TableDrawersSection />}
      </div>
    </TableWrapperContext>
  );
};
