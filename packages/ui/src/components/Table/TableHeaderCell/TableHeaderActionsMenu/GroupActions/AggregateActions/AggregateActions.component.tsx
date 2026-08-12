import { useGetTableColumnGroupingCapability } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';
import { orderLegalAggregates } from '#ui/components/Table/utils';

import type { AggregateActionsProps } from './AggregateActions.types';

import { AggregateButton } from './AggregateButton';
import { ClearColumnAggregateButton } from './ClearColumnAggregateButton';

/**
 * Aggregation-mode block of the column header actions menu: one item per
 * aggregate that is **legal for this column's real type**, plus the clear item.
 *
 * The legality comes from the catalogue answer the loader shipped on the meta
 * store (ADR-058, ADR-063) and from nowhere else. `TableColumn.dataType` is a
 * five-member presentation vocabulary that reports `numeric`, `jsonb` and
 * `point` all as `string`, so a menu built from it offers `sum` on columns that
 * cannot take it and hides it on the one column that can (#550) — which is why
 * this reads a per-column capability rather than a column flag.
 *
 * A column with no resolved capability, or one the catalogue offers nothing
 * for, renders nothing at all: absent means "no aggregate is legal here", never
 * "all of them are".
 */
export const AggregateActions = <TData,>({
  columnKey,
  onClose,
}: AggregateActionsProps<TData>) => {
  const capability = useGetTableColumnGroupingCapability(String(columnKey));
  const offered = orderLegalAggregates({ legal: capability?.aggregates ?? [] });

  if (offered.length === 0) return;

  return (
    <>
      <TableActionsPopoverSeparator />
      {offered.map((fn) => (
        <AggregateButton
          columnKey={String(columnKey)}
          fn={fn}
          key={fn}
          onClose={onClose}
        />
      ))}
      <ClearColumnAggregateButton
        columnKey={String(columnKey)}
        onClose={onClose}
      />
    </>
  );
};
