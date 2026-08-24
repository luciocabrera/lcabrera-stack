import type { DataKey, TableColumn } from '#ui/components/Table/Table.types';
import type {
  ColumnFilter,
  OperatorType,
} from '#ui/types/filterOperators.types';

export type InputContentProps<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly dataType: TableColumn<TData>['dataType'];
  readonly filter?: ColumnFilter;
  readonly hasFetchableOptions: boolean;
  readonly listMaxHeight?: string;
  readonly onChange: (filter?: ColumnFilter) => void;

  readonly operator: OperatorType;
  readonly shouldFillHeight?: boolean;
};
