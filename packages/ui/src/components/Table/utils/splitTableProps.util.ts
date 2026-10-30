import type { TableGridContentProps } from '../TableGrid/TableGrid.types';

type SplitTablePropsArgs<
  TData extends Record<string, unknown>,
  TResponse,
> = Omit<TableGridContentProps<TData, TResponse>, 'dataState'> & {
  readonly response?: unknown;
};

export const splitTableProps = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  actions,
  caption,
  cellPalette,
  cellRenderers,
  columns,
  customStylex,
  dataErrorSelector,
  dataSelector,
  dataTotalSelector,
  density,
  features,
  footer,
  headerDensity,
  icon,
  isFlexWrapperEnabled,
  isLoading,
  layout,
  onLoadMore,
  response,
  title,
  ...tableProps
}: SplitTablePropsArgs<TData, TResponse>) => ({
  own: {
    actions,
    caption,
    cellPalette,
    cellRenderers,
    columns,
    customStylex,
    dataErrorSelector,
    dataSelector,
    dataTotalSelector,
    density,
    features,
    footer,
    headerDensity,
    icon,
    isFlexWrapperEnabled,
    isLoading,
    layout,
    onLoadMore,
    response,
    title,
  },
  tableProps,
});
