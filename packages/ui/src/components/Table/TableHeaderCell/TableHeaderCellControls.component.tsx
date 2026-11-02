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

  const resizeHandle =
    isResizable && features.resize ? (
      <ResizeHandle
        columnKey={menuProps.columnKey}
        columnLabel={menuProps.columnLabel}
      />
    ) : undefined;
  const actionsMenu = features.columnMenu ? (
    <TableHeaderActionsMenu
      {...menuProps}
      hasSettings={hasSettings && features.settings}
    />
  ) : undefined;

  return (
    <>
      {resizeHandle}
      {actionsMenu}
    </>
  );
};
