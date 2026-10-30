import type { TableColumn } from '../Table.types';

export const resolveStaticColumnWidths = <TData>({
  maxWidth,
  minWidth,
  width,
}: Pick<TableColumn<TData>, 'maxWidth' | 'minWidth' | 'width'>) => ({
  maxWidth,
  minWidth,
  width: width === 'fill' ? '100%' : width,
});

export type TableStaticColumnWidths = ReturnType<
  typeof resolveStaticColumnWidths
>;
