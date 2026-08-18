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
  readonly isExpanded: boolean;
};
