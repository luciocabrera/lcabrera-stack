import type { TableGroupLevelDisclosure } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveGroupLevelDisclosures.util';
import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

export type TableGroupDisclosureProps = {
  readonly disclosure: TableGroupDisclosureState | undefined;
  /** The group this opens and closes — the same path expansion is keyed by. */
  readonly path: readonly TableGroupKeyValue[];
};

/**
 * What the hierarchy cell needs in order to draw a disclosure, resolved off the
 * group tree rather than re-derived here.
 *
 * `hasChildren` cannot be read from a summary alone: it is a question about the
 * *other* rows, and rollup answers it counter-intuitively — a subtotal sits
 * **below** the rows it totals, so an adjacency test reports it as childless
 * and leaves the one row a user most wants to fold unfoldable. The tree already
 * settles this in `resolveTableGroupTree`, and the answer travels here.
 */
export type TableGroupDisclosureState = {
  readonly hasChildren: boolean;
  /**
   * Whether the row can fetch its own rows (ADR-079). Disjoint from
   * `hasChildren` in practice: in a rollup the only row owning loaded children
   * is the subtotal, which may not drill, while the leaf that may drill owns
   * nothing loaded. Either one earns a chevron; they are the two ways a row can
   * have something under it.
   */
  readonly isDrillable: boolean;
  readonly isExpanded: boolean;
  /**
   * The groups this row folds, keyed by the column stating each level (#802).
   * It travels on the row's disclosure state rather than as a prop of its own
   * because every key cell of the row needs it and they are all rendered from
   * one descriptor — see `resolveGroupKeyCellDisclosure`.
   */
  readonly levelDisclosures: readonly TableGroupLevelDisclosure[];
};
