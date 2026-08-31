import type {
  TableGroupFold,
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { isGroupCollapsed } from './isGroupCollapsed.util';

export type GroupTreeNode = {
  readonly isVisible: boolean;
  readonly level: number;
  readonly parentKey: string;
  readonly pathKey: string | undefined;
};

type GetHasCollapsedAncestorArgs = {
  readonly defaultFold: TableGroupFold;
  readonly path: readonly TableGroupKeyValue[];
  readonly toggledGroupPaths: ReadonlySet<string>;
};

type OpenGroup = {
  readonly isSubtreeHidden: boolean;
  readonly level: number;
  readonly pathKey: string;
};

type ResolveGroupTreeNodesArgs = {
  readonly defaultFold: TableGroupFold;
  readonly summaries: readonly (TableGroupRowSummary | undefined)[];
  readonly toggledGroupPaths: ReadonlySet<string>;
};

export const ROOT_PARENT_KEY = '';

const resolveGroupLevel = (path: readonly TableGroupKeyValue[]) =>
  Math.max(path.length, 1);

const getHasCollapsedAncestor = ({
  defaultFold,
  path,
  toggledGroupPaths,
}: GetHasCollapsedAncestorArgs) =>
  path.slice(0, -1).some((_unused, index) =>
    isGroupCollapsed({
      defaultFold,
      pathKey: resolveGroupPathKey(path.slice(0, index + 1)),
      toggledGroupPaths,
    }),
  );

export const resolveGroupTreeNodes = ({
  defaultFold,
  summaries,
  toggledGroupPaths,
}: ResolveGroupTreeNodesArgs): readonly GroupTreeNode[] => {
  const nodes: GroupTreeNode[] = [];
  let openGroup: OpenGroup | undefined;

  for (const summary of summaries) {
    if (summary === undefined) {
      nodes.push({
        isVisible: !(openGroup?.isSubtreeHidden ?? false),
        level: (openGroup?.level ?? 0) + 1,
        parentKey: openGroup?.pathKey ?? ROOT_PARENT_KEY,
        pathKey: undefined,
      });
      continue;
    }

    const { path } = summary;
    const level = resolveGroupLevel(path);
    const pathKey = resolveGroupPathKey(path);
    const isVisible = !getHasCollapsedAncestor({
      defaultFold,
      path,
      toggledGroupPaths,
    });

    nodes.push({
      isVisible,
      level,
      parentKey:
        path.length <= 1
          ? ROOT_PARENT_KEY
          : resolveGroupPathKey(path.slice(0, -1)),
      pathKey,
    });
    openGroup = {
      isSubtreeHidden:
        !isVisible ||
        isGroupCollapsed({ defaultFold, pathKey, toggledGroupPaths }),
      level,
      pathKey,
    };
  }

  return nodes;
};
