import type {
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

export type TableGroupLevelDisclosure = {
  readonly columnKey: string;
  readonly isExpanded: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

type ResolveGroupLevelDisclosuresArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  readonly foldableKeys: ReadonlySet<string>;
  readonly pathKey: string | undefined;
  readonly summary: TableGroupRowSummary | undefined;
};

const NOTHING: readonly TableGroupLevelDisclosure[] = [];

export const resolveGroupLevelDisclosures = ({
  collapsedGroupPaths,
  foldableKeys,
  pathKey,
  summary,
}: ResolveGroupLevelDisclosuresArgs): readonly TableGroupLevelDisclosure[] => {
  if (summary === undefined || summary.path.length === 0) return NOTHING;

  const disclosures: TableGroupLevelDisclosure[] = [];

  for (const [index, entry] of summary.path.entries()) {
    const path = summary.path.slice(0, index + 1);
    const levelKey = resolveGroupPathKey(path);

    if (!foldableKeys.has(levelKey)) continue;

    const isCollapsed = collapsedGroupPaths.has(levelKey);

    if (!isCollapsed && levelKey === pathKey && summary.isSubtotal) continue;

    disclosures.push({
      columnKey: entry.columnKey,
      isExpanded: !isCollapsed,
      path,
    });
  }

  return disclosures;
};
