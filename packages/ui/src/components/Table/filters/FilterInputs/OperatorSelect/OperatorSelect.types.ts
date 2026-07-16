import type { TableColumnDataType } from '@repo/ui/components/Table/Table.types';
import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

export type OperatorSelectProps = {
  readonly dataType?: TableColumnDataType;
  readonly filter?: ColumnFilter;
  readonly onChange: (filter: ColumnFilter) => void;
  readonly onOpenChange: (isOpen: boolean) => void;
  readonly shouldFillHeight?: boolean;
};
