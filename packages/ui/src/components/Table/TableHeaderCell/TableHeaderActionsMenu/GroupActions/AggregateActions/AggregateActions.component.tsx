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
