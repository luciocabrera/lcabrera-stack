import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '#ui/components/Button';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';
import { isTableAggregateFn } from '#ui/components/Table/utils';
import { resolveOfferableAggregates } from '#ui/components/Table/utils/resolveOfferableAggregates.util';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddAggregateSectionProps } from './AddAggregateSection.types';

import { useAddColumnAggregate } from '../../TableDrawerContext/actions';
import { useGetGroupingKeys } from '../../TableDrawerContext/selectors';
import { toAggregatableColumnOptions } from '../utils';
import { styles } from './AddAggregateSection.stylex';

/**
 * The drawer's "add an aggregate" control: a column, then a function that may
 * be offered for it.
 *
 * Both lists resolve through `resolveOfferableAggregates` — the column list via
 * `toAggregatableColumnOptions`, the function list directly — so the second
 * cannot offer something the chosen column does not support, whichever way the
 * two are picked, and neither can disagree with the column header menu, which
 * calls the same predicate (#830). What that predicate answers with is the
 * catalogue capability the loader shipped (ADR-058, ADR-063), minus any column
 * staged as a group key (ADR-080).
 *
 * A column may be picked more than once, with a different function each time
 * (#831). Adding a function already applied to the column is a no-op rather
 * than a second row — `addTableColumnAggregate` guards the duplicate, so the
 * pair cannot appear twice however the picker is driven.
 *
 * There is deliberately no filter input beside them. A *filtered* aggregate has
 * no slot in the compact `grouping` param every piece of this configuration
 * round-trips through, so offering one would build a state a shared link
 * silently loses (#569).
 */
export const AddAggregateSection = ({
  isBusy = false,
}: AddAggregateSectionProps) => {
  const columns = useGetColumns();
  const capabilities = useGetTableGroupingCapabilities();
  const groupingKeys = useGetGroupingKeys();
  const addColumnAggregate = useAddColumnAggregate();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedFn, setSelectedFn] = useState('');

  const columnOptions = toAggregatableColumnOptions({
    capabilities,
    columns,
    groupingKeys,
  });
  const stagedGroupKeys = new Set(groupingKeys);
  const fnOptions = resolveOfferableAggregates({
    capability: capabilities[selectedColumn],
    isGroupKey: stagedGroupKeys.has(selectedColumn),
  }).map((fn) => ({ label: TABLE_AGGREGATE_LABELS[fn], value: fn }));

  const handleColumnChange = (values: readonly string[]) => {
    setSelectedColumn(values[0] ?? '');
    // The function list is derived from the column, so a function chosen for
    // the previous one may not exist for this one.
    setSelectedFn('');
  };

  const handleAddAggregate = () => {
    if (!selectedColumn || !isTableAggregateFn(selectedFn)) return;

    addColumnAggregate({ columnKey: selectedColumn, fn: selectedFn });
    setSelectedColumn('');
    setSelectedFn('');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader title='Add Aggregate' />
      <VirtualSelect
        isBusy={isBusy}
        mode='single'
        onChange={handleColumnChange}
        options={columnOptions}
        placeholder='Select a column...'
        selected={selectedColumn ? [selectedColumn] : []}
      />
      <VirtualSelect
        isBusy={isBusy || !selectedColumn}
        mode='single'
        onChange={(values) => {
          setSelectedFn(values[0] ?? '');
        }}
        options={fnOptions}
        placeholder='Select a function...'
        selected={selectedFn ? [selectedFn] : []}
      />
      <Button
        isBusy={isBusy}
        isDisabled={!selectedColumn || !selectedFn}
        onClick={handleAddAggregate}
        variant='primary'
      >
        Add
      </Button>
    </div>
  );
};
