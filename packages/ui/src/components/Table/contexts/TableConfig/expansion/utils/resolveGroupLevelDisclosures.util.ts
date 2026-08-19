import type {
  TableGroupKeyValue,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

/** One fold control a group row offers, in the key column that states its level. */
export type TableGroupLevelDisclosure = {
  /** The group-key column this control is drawn in. */
  readonly columnKey: string;
  readonly isExpanded: boolean;
  /** The group this folds — the same path expansion is keyed by. */
  readonly path: readonly TableGroupKeyValue[];
};

type ResolveGroupLevelDisclosuresArgs = {
  readonly collapsedGroupPaths: ReadonlySet<string>;
  /** The groups that own rows and have a row of their own — `collectFoldableGroupPaths`. */
  readonly foldableKeys: ReadonlySet<string>;
  /** This row's own group, when it is a group row. */
  readonly pathKey: string | undefined;
  readonly summary: TableGroupRowSummary | undefined;
};

const NOTHING: readonly TableGroupLevelDisclosure[] = [];

/**
 * The groups one row can fold, keyed by the column each is stated in.
 *
 * A row folds its **ancestors**, not itself, and that is the whole of why the
 * control moved off the subtotal. Under a rollup the subtotal is the only row
 * that owns loaded children, so it was the only row that could carry a chevron
 * — and it is emitted *after* the rows it totals, which put the control at the
 * end of a block whose start the reader is looking at (#802). Asking the
 * question of a **level** instead of a row answers it from the path prefix,
 * which every row inside the group carries.
 *
 * **A row skips its own group only when it is a subtotal**, and that condition
 * is doing the real work. A subtotal is emitted *after* the rows it totals
 * (#570), so it is the one kind of group row that sits at the end of its own
 * block — which is the whole defect. Every other group row **precedes** what it
 * owns, so folding itself from its own cell already puts the control at the
 * top, and skipping it there would take the chevron away from an ordinary
 * grouped grid entirely.
 *
 * **A collapsed subtotal keeps its control**, which is why the condition is
 * stated in terms of collapse rather than identity alone: once the group folds,
 * every row inside it is hidden and the subtotal is all that survives, so the
 * control has to return there or the group could never be reopened.
 *
 * **A level with no row of its own is not offered at all**, which is what
 * `foldableKeys` carries and a bare set of parent keys does not. Under `flat`
 * every ancestor is somebody's parent and none of them is rendered, so folding
 * one would hide its rows and leave nothing behind to reopen it from — see
 * `collectFoldableGroupPaths`, which is where that intersection is made.
 *
 * Presence in the returned list **is** the answer — a level with no entry has no
 * control. The caller does not re-derive `hasChildren`, which is the mistake
 * that would put two disagreeing predicates on the same question.
 */
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
