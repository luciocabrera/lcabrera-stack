export type ResolveContentModeArgs = {
  readonly filteredOptionsCount: number;
  readonly isInitialLoading: boolean;
};

export const resolveContentMode = ({
  filteredOptionsCount,
  isInitialLoading,
}: ResolveContentModeArgs) => {
  if (isInitialLoading) return 'loading' as const;
  return filteredOptionsCount === 0 ? ('empty' as const) : ('list' as const);
};
