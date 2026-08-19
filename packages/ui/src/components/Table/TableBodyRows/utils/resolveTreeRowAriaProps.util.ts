import type { TableGroupTreeRowMeta } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveTableGroupTree.util';

/**
 * The tree attributes one body row carries, or none at all when the grid is not
 * a tree.
 *
 * Every row of a `treegrid` gets the same three — level, position and set size
 * — group and detail alike, because two rows exposing different structures is
 * exactly what makes a tree unreadable to a screen reader. `aria-expanded` is
 * the exception and is deliberately absent on a leaf: on a row with nothing
 * under it the attribute would announce a control the user cannot operate.
 *
 * A **drillable** leaf gets `aria-expanded` too, and reads `false` until the
 * group has been opened. It owns no loaded children, but it can reveal rows,
 * which is what the attribute describes — and the two flags are disjoint in a
 * rollup, where the only row with loaded children is the subtotal that may not
 * drill (ADR-079).
 *
 * **Opened, not loaded.** It flips the moment a drill is asked for, because the
 * loading row and the failure row are themselves content under the group. A
 * control that reports itself closed while showing a spinner underneath would
 * describe the tree wrongly for exactly as long as the fetch takes.
 *
 * `undefined` for an attribute means React omits it, which is what keeps an
 * ungrouped grid's markup byte-identical to what it was before tree semantics
 * existed (ADR-067).
 */
export const resolveTreeRowAriaProps = (
  meta: TableGroupTreeRowMeta | undefined,
) =>
  meta === undefined
    ? {}
    : {
        'aria-expanded':
          meta.hasChildren || meta.isDrillable ? meta.isExpanded : undefined,
        'aria-level': meta.level,
        'aria-posinset': meta.posInSet,
        'aria-setsize': meta.setSize,
      };
