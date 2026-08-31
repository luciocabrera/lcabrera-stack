import type {
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

export type GroupTreeNode = {
  readonly isVisible: boolean;
  readonly level: number;
  readonly parentKey: string;
  readonly pathKey: string | undefined;
};

type GetHasCollapsedAncestorArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly path: readonly TableGroupKeyValue[];
};

type OpenGroup = {
  readonly isSubtreeHidden: boolean;
  readonly level: number;
  readonly pathKey: string;
};

type ResolveGroupTreeNodesArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly summaries: readonly (TableGroupRowSummary | undefined)[];
};

export const ROOT_PARENT_KEY = '';

const resolveGroupLevel = (path: readonly TableGroupKeyValue[]) =>
  Math.max(path.length, 1);

const getHasCollapsedAncestor = ({
  collapsedGroupPaths,
  path,
}: GetHasCollapsedAncestorArgs) =>
  path
    .slice(0, -1)
    .some((_unused, index) =>
      collapsedGroupPaths.has(resolveGroupPathKey(path.slice(0, index + 1))),
    );

export const resolveGroupTreeNodes = ({
  collapsedGroupPaths,
  summaries,
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
    const isVisible = !getHasCollapsedAncestor({ collapsedGroupPaths, path });

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
      isSubtreeHidden: !isVisible || collapsedGroupPaths.has(pathKey),
      level,
      pathKey,
    };
  }

  return nodes;
};
