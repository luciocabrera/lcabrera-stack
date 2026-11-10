import type { TableColumnDataType } from '#ui/components/Table/Table.types';
import type { VirtualSelectAttachedEdge } from '#ui/components/VirtualSelect/VirtualSelect.types';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

export type OperatorSelectProps = {
  readonly attachedEdge?: VirtualSelectAttachedEdge;
  readonly dataType?: TableColumnDataType;
  readonly filter?: ColumnFilter;
  readonly onChange: (filter: ColumnFilter) => void;
  readonly onOpenChange: (isOpen: boolean) => void;
};
