import { use } from 'react';

import type { UseTableCellFocusArgs } from '#ui/components/Table/hooks/useTableCellFocus.types';

import { TablePresentationContext } from '#ui/components/Table/contexts/TableConfig/TablePresentationContext.context';
import { useTableCellFocus } from '#ui/components/Table/hooks';

export const useTableBodyCellSemantics = (args: UseTableCellFocusArgs) => {
  const { layout } = use(TablePresentationContext);
  const { cellRef, ...focusProps } = useTableCellFocus(args);

  return {
    cellProps: layout === 'static' ? {} : { ...focusProps, role: 'gridcell' },
    cellRef,
  };
};
