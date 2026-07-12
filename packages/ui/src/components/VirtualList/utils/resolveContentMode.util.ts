export type ResolveContentModeArgs = {
  readonly filteredOptionsCount: number;
  readonly isInitialLoading: boolean;
};

export const resolveContentMode = ({
  filteredOptionsCount,
  isInitialLoading,
}: ResolveContentModeArgs) => {
  if (isInitialLoading) return 'loading' as const;
  if (filteredOptionsCount === 0) return 'empty' as const;
  return 'list' as const;
};
