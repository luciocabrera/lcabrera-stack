import type { TableGroupFold } from '#ui/components/Table/Table.types';

type ResolveFoldAllTargetArgs = {
  readonly defaultFold: TableGroupFold;
  readonly foldableGroupPaths: ReadonlySet<string>;
  readonly isExpanded: boolean;
};

const NO_PATHS: ReadonlySet<string> = new Set<string>();

/**
 * The toggled set that puts every foldable group the asked-for way: empty when that way
 * **is** the default, and every foldable path when it is the opposite.
 * Both fold-all directions come from here rather than one of them assuming the empty set
 * means "open", which is only true under the shipped `expanded` default.
 */
export const resolveFoldAllTarget = ({
  defaultFold,
  foldableGroupPaths,
  isExpanded,
}: ResolveFoldAllTargetArgs): ReadonlySet<string> => {
  const askedFor = isExpanded ? 'expanded' : 'collapsed';

  return askedFor === defaultFold ? NO_PATHS : foldableGroupPaths;
};
