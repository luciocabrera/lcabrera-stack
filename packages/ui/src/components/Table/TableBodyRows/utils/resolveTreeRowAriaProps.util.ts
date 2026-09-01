import type { TableGroupTreeRowMeta } from '#ui/components/Table/contexts/TableConfig/expansion/utils/resolveTableGroupTree.util';

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
