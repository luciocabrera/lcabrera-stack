import type { TableColumn, TableColumnDataType } from '../Table.types';

type CreateBasicColumnArgs<TData extends Record<string, unknown>> = {
  readonly dataType: TableColumnDataType;
  readonly key: keyof TData & string;
  readonly label: string;
  readonly maxWidth: number;
  readonly minWidth: number;
};

export const createBasicColumn = <TData extends Record<string, unknown>>({
  dataType,
  key,
  label,
  maxWidth,
  minWidth,
}: CreateBasicColumnArgs<TData>): TableColumn<TData> => {
  return {
    dataType,
    key,
    label,
    maxWidth,
    minWidth,
  };
};
