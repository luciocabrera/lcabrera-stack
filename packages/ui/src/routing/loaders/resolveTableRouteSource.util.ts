import type {
  TableRouteLoaderSourceArgs,
  TableRouteSource,
} from './loaders.types';

export const resolveTableRouteSource = <
  TData extends Record<string, unknown>,
  TResponse,
>(
  args: TableRouteLoaderSourceArgs<TData, TResponse>,
): TableRouteSource<TData, TResponse> => {
  return args.source === undefined ? args : args.source;
};
