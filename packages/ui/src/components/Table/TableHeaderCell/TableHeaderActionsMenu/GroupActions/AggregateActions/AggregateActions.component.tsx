import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableColumnGroupingCapability } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';
import { resolveOfferableAggregates } from '#ui/components/Table/utils/resolveOfferableAggregates.util';

import type { AggregateActionsProps } from './AggregateActions.types';

import { AggregateButton } from './AggregateButton';
import { ClearColumnAggregateButton } from './ClearColumnAggregateButton';

/**
 * Aggregation-mode block of the column header actions menu: one item per
 * aggregate this column may be offered, plus the clear item.
 *
 * What may be offered is `resolveOfferableAggregates`' answer and nothing this
 * component derives — the same call the drawer's "Add Aggregate" picker filters
 * its column list through. Two surfaces answering "may this column be
 * aggregated" separately is how they came to disagree: the menu kept offering
 * functions on a column the picker had already dropped, and clicking one wrote
 * the grouping store and changed nothing on screen (#830).
 *
 * So both of the conditions live there, not here: the catalogue's type legality
 * (ADR-058, ADR-063, #550) and the column being an active group key (ADR-080).
 * A self-connected delegate, it reads the applied keys from the grouping store
 * itself, exactly as `GroupByColumnButton` beside it does.
 *
 * An empty answer renders nothing at all — no functions and no clear item —
 * because absent means "no aggregate is legal here", never "all of them are".
 * That single early return is the only exit for "nothing to offer", whichever
 * condition produced it.
 */
export const AggregateActions = <TData,>({
  columnKey,
  onClose,
}: AggregateActionsProps<TData>) => {
  const capability = useGetTableColumnGroupingCapability(String(columnKey));
  const groupingKeys = useGetTableGroupingKeys();
  const offered = resolveOfferableAggregates({
    capability,
    isGroupKey: groupingKeys.includes(String(columnKey)),
  });

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
