import type { TableColumn } from '../Table.types';

type ResolveStaticColumnWidthsArgs<TData> = Pick<
  TableColumn<TData>,
  'maxWidth' | 'minWidth' | 'width'
> & {
  readonly sizedWidth?: number;
};

export const resolveStaticColumnWidths = <TData>({
  maxWidth,
  minWidth,
  sizedWidth,
  width,
}: ResolveStaticColumnWidthsArgs<TData>) => ({
  maxWidth,
  minWidth,
  width: sizedWidth ?? (width === 'fill' ? '100%' : width),
});

export type TableStaticColumnWidths = ReturnType<
  typeof resolveStaticColumnWidths
>;
