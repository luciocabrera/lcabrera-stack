import {
  useGetTableGroupingAggregates,
  useGetTableGroupingKeys,
} from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableColumnGroupingCapability } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';
import { resolveAffordableAggregates } from '#ui/components/Table/utils/resolveAffordableAggregates.util';

import type { AggregateActionsProps } from './AggregateActions.types';

import { AggregateButton } from './AggregateButton';
import { ClearColumnAggregateButton } from './ClearColumnAggregateButton';

/**
 * Two surfaces answering "may this column be aggregated" separately is how they came to
 * disagree: the menu kept offering functions on a column the picker had already dropped,
 * and clicking one wrote the grouping store and changed nothing on screen (#830).
 * So all three conditions live there, not here: the catalogue's type legality (ADR-058,
 * ADR-063, #550) and the column being an active group key (ADR-080), both from
 * `resolveOfferableAggregates`, plus the read's `countDistinct` budget — a property of the
 * whole request rather than of this column, which is why it composes on top of that
 * predicate instead of widening it (#842).
 */
export const AggregateActions = <TData,>({
  columnKey,
  onClose,
}: AggregateActionsProps<TData>) => {
  const key = String(columnKey);
  const capability = useGetTableColumnGroupingCapability(key);
  const groupingKeys = useGetTableGroupingKeys();
  const applied = useGetTableGroupingAggregates();
  const { affordable } = resolveAffordableAggregates({
    applied,
    capability,
    columnKey: key,
    isGroupKey: groupingKeys.includes(key),
  });

  if (affordable.length === 0) return;

  return (
    <>
      <TableActionsPopoverSeparator />
      {affordable.map((fn) => (
        <AggregateButton columnKey={key} fn={fn} key={fn} onClose={onClose} />
      ))}
      <ClearColumnAggregateButton columnKey={key} onClose={onClose} />
    </>
  );
};
