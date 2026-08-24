import type { TableGroupTreeRowMeta } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveTableGroupTree.util';

/**
 * `aria-expanded` is the exception and is deliberately absent on a leaf: on a row with
 * nothing under it the attribute would announce a control the user cannot operate.
 * `undefined` for an attribute means React omits it, which is what keeps an ungrouped
 * grid's markup byte-identical to what it was before tree semantics existed (ADR-067).
 */
export const resolveTreeRowAriaProps = (
  meta: TableGroupTreeRowMeta | undefined,
) =>
  meta === undefined
    ? {}
    : {
        'aria-expanded': meta.hasChildren ? meta.isExpanded : undefined,
        'aria-level': meta.level,
        'aria-posinset': meta.posInSet,
        'aria-setsize': meta.setSize,
      };
