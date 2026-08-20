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
 * Aggregation-mode block of the column header actions menu: one item per
 * aggregate this column may be offered, plus the clear item.
 *
 * What may be offered is `resolveAffordableAggregates`' answer and nothing this
 * component derives — the same call the drawer's "Add Aggregate" picker resolves
 * through. Two surfaces answering "may this column be aggregated" separately is
 * how they came to disagree: the menu kept offering functions on a column the
 * picker had already dropped, and clicking one wrote the grouping store and
 * changed nothing on screen (#830).
 *
 * So all three conditions live there, not here: the catalogue's type legality
 * (ADR-058, ADR-063, #550) and the column being an active group key (ADR-080),
 * both from `resolveOfferableAggregates`, plus the read's `countDistinct` budget
 * — a property of the whole request rather than of this column, which is why it
 * composes on top of that predicate instead of widening it (#842). A
 * self-connected delegate, it reads the applied keys and aggregates from the
 * grouping store itself, exactly as `GroupByColumnButton` beside it does.
 *
 * The budget rule takes this column's own aggregates out of the count, so the
 * `countDistinct` **applied here** goes on being offered while every other
 * column's is withheld. That item is the only way to toggle it off, and a rule
 * that withheld it everywhere would strand the user with a measure they cannot
 * clear from the menu it was applied from.
 *
 * An empty answer renders nothing at all — no functions and no clear item —
 * because absent means "there is nothing to offer here", never "offer all of
 * them". That single early return is the only exit, whichever condition produced
 * it, and since #842 one of those conditions is **affordability** rather than
 * legality: a column whose only offerable function is `countDistinct` shows
 * nothing while another column carries one. The clear item goes with it and
 * costs the user nothing, because that case implies the column carries no
 * aggregate — a column that carried the distinct count would count zero against
 * itself and so always see room.
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
