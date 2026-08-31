import type {
  TableGroupFold,
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { isGroupCollapsed } from './isGroupCollapsed.util';

export type TableGroupLevelDisclosure = {
  readonly columnKey: string;
  readonly isExpanded: boolean;
  readonly path: readonly TableGroupKeyValue[];
};

type ResolveGroupLevelDisclosuresArgs = {
  readonly defaultFold: TableGroupFold;
  readonly foldableKeys: ReadonlySet<string>;
  readonly pathKey: string | undefined;
  readonly summary: TableGroupRowSummary | undefined;
  readonly toggledGroupPaths: ReadonlySet<string>;
};

const NOTHING: readonly TableGroupLevelDisclosure[] = [];

/**
 * Under a rollup the subtotal is the only row that owns loaded children, so it was the
 * only row that could carry a chevron — and it is emitted *after* the rows it totals,
 * which put the control at the end of a block whose start the reader is looking at (#802).
 * Asking the question of a **level** instead of a row answers it from the path prefix,
 * which every row inside the group carries.
 */
export const resolveGroupLevelDisclosures = ({
  defaultFold,
  foldableKeys,
  pathKey,
  summary,
  toggledGroupPaths,
}: ResolveGroupLevelDisclosuresArgs): readonly TableGroupLevelDisclosure[] => {
  if (summary === undefined || summary.path.length === 0) return NOTHING;

  const disclosures: TableGroupLevelDisclosure[] = [];

  for (const [index, entry] of summary.path.entries()) {
    const path = summary.path.slice(0, index + 1);
    const levelKey = resolveGroupPathKey(path);

    if (!foldableKeys.has(levelKey)) continue;

    const isCollapsed = isGroupCollapsed({
      defaultFold,
      pathKey: levelKey,
      toggledGroupPaths,
    });

    if (!isCollapsed && levelKey === pathKey && summary.isSubtotal) continue;

    disclosures.push({
      columnKey: entry.columnKey,
      isExpanded: !isCollapsed,
      path,
    });
  }

  return disclosures;
};
