import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';

import {
  TABLE_GROUP_GRAND_TOTAL_LABEL,
  TABLE_GROUP_SUBTOTAL_SUFFIX,
} from '#ui/components/Table/Table.constants';

type ToGroupHierarchyLabelArgs = {
  readonly summary: TableGroupRowSummary;
};

/**
 * What the hierarchy column shows for one group row, and how deep it sits.
 *
 * The **innermost** key value is the label, because every level above it is
 * already stated by the group row this one is indented under — the whole
 * argument for a hierarchy column rather than a banner repeating the path on
 * every row.
 *
 * Depth is `path.length - 1`, so a group and the subtotal of the level beneath
 * it are one step apart: a subtotal carries one path entry fewer than the rows
 * it totals, which is exactly what puts it at its children's parent's depth.
 * The grand total has no path at all and sits at zero.
 *
 * **This is where a real NULL and a structural subtotal stop looking alike.** A
 * group whose `shipping_country` is genuinely NULL and a subtotal across every
 * country produce the same text from the same column, so nothing in the label
 * separates them — `isSubtotal` does, and it turns into a different word
 * (`EMEA total`), a different weight and a shallower indent.
 */
export const toGroupHierarchyLabel = ({
  summary,
}: ToGroupHierarchyLabelArgs) => {
  const innermost = summary.path.at(-1);
  const depth = Math.max(summary.path.length - 1, 0);

  if (innermost === undefined) {
    return {
      depth,
      isSubtotal: summary.isSubtotal,
      text: TABLE_GROUP_GRAND_TOTAL_LABEL,
    };
  }

  return {
    depth,
    isSubtotal: summary.isSubtotal,
    text: summary.isSubtotal
      ? `${innermost.label} ${TABLE_GROUP_SUBTOTAL_SUFFIX}`
      : innermost.label,
  };
};
