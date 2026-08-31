import type { TableGroupFold } from '#ui/components/Table/Table.types';

type ResolveFoldAllTargetArgs = {
  readonly defaultFold: TableGroupFold;
  readonly foldableGroupPaths: ReadonlySet<string>;
  readonly isExpanded: boolean;
};

const NO_PATHS: ReadonlySet<string> = new Set<string>();

export const resolveFoldAllTarget = ({
  defaultFold,
  foldableGroupPaths,
  isExpanded,
}: ResolveFoldAllTargetArgs): ReadonlySet<string> => {
  const askedFor = isExpanded ? 'expanded' : 'collapsed';

  return askedFor === defaultFold ? NO_PATHS : foldableGroupPaths;
};
