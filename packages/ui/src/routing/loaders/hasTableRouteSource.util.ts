import type {
  TableRouteLoaderSourceArgs,
  TableRouteSource,
} from './loaders.types';

export const hasTableRouteSource = <
  TData extends Record<string, unknown>,
  TResponse,
>(
  args: TableRouteLoaderSourceArgs<TData, TResponse>,
): args is Extract<
  TableRouteLoaderSourceArgs<TData, TResponse>,
  { readonly source: TableRouteSource<TData, TResponse> }
> => args.source !== undefined;
