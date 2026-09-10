import type { TableColumn } from '../Table.types';

type ArePaintedColumnsUnchangedArgs<TData> = {
  readonly current: readonly TableColumn<TData>[];
  readonly next: readonly TableColumn<TData>[];
};

export const arePaintedColumnsUnchanged = <TData>({
  current,
  next,
}: ArePaintedColumnsUnchangedArgs<TData>) =>
  current.length === next.length &&
  current.every((column, index) => {
    const other = next[index];

    return (
      other !== undefined &&
      String(column.key) === String(other.key) &&
      column.label === other.label &&
      column.headerGroupLabel === other.headerGroupLabel
    );
  });
