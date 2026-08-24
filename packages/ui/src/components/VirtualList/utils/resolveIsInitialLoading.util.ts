type ResolveIsInitialLoadingArgs = {
  readonly hasFetchInitial: boolean;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly optionsCount: number;
};

export const resolveIsInitialLoading = ({
  hasFetchInitial,
  isLoading,
  isLoadingMore,
  optionsCount,
}: ResolveIsInitialLoadingArgs) => {
  const isLoadingOptions = isLoading || isLoadingMore;
  const isBootstrappingInitialLoad =
    hasFetchInitial && optionsCount === 0 && !isLoadingOptions;

  return optionsCount === 0 && (isLoading || isBootstrappingInitialLoad);
};
