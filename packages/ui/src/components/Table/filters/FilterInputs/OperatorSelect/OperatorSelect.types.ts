import type { TableColumnDataType } from '@lcabrera/ui/components/Table/Table.types';
import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

export type OperatorSelectProps = {
  readonly dataType?: TableColumnDataType;
  readonly filter?: ColumnFilter;
  readonly onChange: (filter: ColumnFilter) => void;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly shouldFillHeight?: boolean;
};
