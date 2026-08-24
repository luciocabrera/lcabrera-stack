type GetTotalRowsArgs<TResponse> = {
  readonly data: readonly string[];
  readonly dataTotalSelector?: (response: TResponse) => number | undefined;
  readonly response: TResponse;
};

export const getTotalRows = <TResponse>({
  data,
  dataTotalSelector,
  response,
}: GetTotalRowsArgs<TResponse>) => dataTotalSelector?.(response) ?? data.length;
