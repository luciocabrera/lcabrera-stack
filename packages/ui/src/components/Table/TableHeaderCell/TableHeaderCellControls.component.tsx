import { use } from 'react';

import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';

import type { TableHeaderCellControlsProps } from './TableHeaderCell.types';

import { ResizeHandle } from './ResizeHandle';
import { TableHeaderActionsMenu } from './TableHeaderActionsMenu';

export const TableHeaderCellControls = <TData,>({
  hasSettings,
  isResizable,
  ...menuProps
}: TableHeaderCellControlsProps<TData>) => {
  const { features } = use(TablePresentationContext);

  return (
    <>
      {features.resize !== false && isResizable !== false && (
        <ResizeHandle
          columnKey={menuProps.columnKey}
          columnLabel={menuProps.columnLabel}
        />
      )}
      {features.columnMenu !== false && (
        <TableHeaderActionsMenu
          {...menuProps}
          hasSettings={hasSettings && features.settings}
        />
      )}
    </>
  );
};
