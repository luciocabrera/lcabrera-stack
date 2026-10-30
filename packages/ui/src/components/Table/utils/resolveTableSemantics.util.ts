import type { TableLayoutMode } from '../Table.types';

import { resolveAriaRowCount } from './resolveGridRowIndexing.util';
import { resolveTableRole } from './resolveTableRole.util';

type ResolveTableSemanticsArgs<TFocusProps> = {
  readonly gridFocusProps: TFocusProps;
  readonly isLoading: boolean;
  readonly isTreeGrid: boolean;
  readonly layout: TableLayoutMode;
  readonly totalRows: number;
};

export const resolveTableSemantics = <TFocusProps extends object>({
  gridFocusProps,
  isLoading,
  isTreeGrid,
  layout,
  totalRows,
}: ResolveTableSemanticsArgs<TFocusProps>) => {
  const role = resolveTableRole({ isTreeGrid, layout });

  if (layout === 'static') return { role };

  return {
    ...gridFocusProps,
    'aria-rowcount': resolveAriaRowCount({ isLoading, totalRows }),
    role,
  };
};
