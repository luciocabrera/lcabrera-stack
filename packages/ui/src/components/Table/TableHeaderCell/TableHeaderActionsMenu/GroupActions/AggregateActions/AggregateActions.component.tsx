import { toDeclaredColumnKey } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils/toDeclaredColumnKey.util';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import {
  useGetTableGroupingAggregates,
  useGetTableGroupingKeys,
} from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableColumnGroupingCapability } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TableActionsPopoverSeparator } from '#ui/components/Table/TableActionsPopover';
import { resolveAffordableAggregates } from '#ui/components/Table/utils/resolveAffordableAggregates.util';
import { resolveMeasureAggregateTitle } from '#ui/components/Table/utils/resolveMeasureAggregateTitle.util';

import type { AggregateActionsProps } from './AggregateActions.types';

import { AggregateButton } from './AggregateButton';
import { ClearColumnAggregateButton } from './ClearColumnAggregateButton';

export const AggregateActions = <TData,>({
  columnKey,
  onClose,
}: AggregateActionsProps<TData>) => {
  const columns = useGetColumns<TData>();
  const key = String(toDeclaredColumnKey<TData>({ columnKey, columns }));
  const capability = useGetTableColumnGroupingCapability(key);
  const groupingKeys = useGetTableGroupingKeys();
  const applied = useGetTableGroupingAggregates();
  const { affordable } = resolveAffordableAggregates({
    applied,
    capability,
    columnKey: key,
    isGroupKey: groupingKeys.includes(key),
  });

  if (groupingKeys.length === 0 || affordable.length === 0) return;

  const isMeasure = key !== String(columnKey);
  const functionTitle = resolveMeasureAggregateTitle({
    isMeasure,
    target: 'function',
  });
  const clearTitle = resolveMeasureAggregateTitle({
    isMeasure,
    target: 'clear',
  });

  return (
    <>
      <TableActionsPopoverSeparator />
      {affordable.map((fn) => (
        <AggregateButton
          columnKey={key}
          fn={fn}
          key={fn}
          onClose={onClose}
          {...(functionTitle !== undefined && { title: functionTitle })}
        />
      ))}
      <ClearColumnAggregateButton
        columnKey={key}
        onClose={onClose}
        {...(clearTitle !== undefined && { title: clearTitle })}
      />
    </>
  );
};
