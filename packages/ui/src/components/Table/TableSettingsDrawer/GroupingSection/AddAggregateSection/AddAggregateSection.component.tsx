import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '#ui/components/Button';
import { InfoBox } from '#ui/components/InfoBox';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddAggregateSectionProps } from './AddAggregateSection.types';

import { useAddColumnAggregate } from '../../TableDrawerContext/actions';
import {
  useGetGroupingAggregates,
  useGetGroupingKeys,
} from '../../TableDrawerContext/selectors';
import {
  resolveAddableAggregates,
  toAggregatableColumnOptions,
} from '../utils';
import { styles } from './AddAggregateSection.stylex';

/**
 * The drawer's "add an aggregate" control: a column, then a function that may
 * be offered for it.
 *
 * Both lists resolve through `resolveOfferableAggregates` — the column list via
 * `toAggregatableColumnOptions`, the function list via
 * `resolveAddableAggregates` — so the second cannot offer something the chosen
 * column does not support, whichever way the two are picked, and neither can
 * disagree with the column header menu, which calls the same predicate (#830).
 * What that predicate answers with is the catalogue capability the loader
 * shipped (ADR-058, ADR-063), minus any column staged as a group key (ADR-080).
 *
 * A column may be picked more than once, with a different function each time
 * (#831) — but never the same function twice, so the functions already staged
 * on the chosen column are subtracted here and **not** in the shared predicate,
 * which the header menu reads and which must keep offering an applied function
 * as its toggle-off. `resolveAddableAggregates` owns that asymmetry (#841).
 *
 * Nothing is offered that would not change the grouping, so the Add button acts
 * on the current option list rather than on the raw selection: a function that
 * stops being addable under the picker — the column is staged as a key, or the
 * function is now applied — cannot be submitted from a stale selection.
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
  const aggregates = useGetGroupingAggregates();
  const addColumnAggregate = useAddColumnAggregate();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedFn, setSelectedFn] = useState('');

  const columnOptions = toAggregatableColumnOptions({
    capabilities,
    columns,
    groupingKeys,
  });
  const stagedGroupKeys = new Set(groupingKeys);
  const { isExhausted, options: fnOptions } = resolveAddableAggregates({
    applied: aggregates,
    capability: capabilities[selectedColumn],
    columnKey: selectedColumn,
    isGroupKey: stagedGroupKeys.has(selectedColumn),
  });
  const selectedOption = fnOptions.find(
    (option) => option.value === selectedFn,
  );

  const handleColumnChange = (values: readonly string[]) => {
    setSelectedColumn(values[0] ?? '');
    // The function list is derived from the column, so a function chosen for
    // the previous one may not exist for this one.
    setSelectedFn('');
  };

  const handleAddAggregate = () => {
    if (!selectedColumn || selectedOption === undefined) return;

    addColumnAggregate({ columnKey: selectedColumn, fn: selectedOption.value });
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
      {isExhausted ? (
        <InfoBox>
          Every function this column supports is already applied. Remove one to
          add another.
        </InfoBox>
      ) : (
        <VirtualSelect
          isBusy={isBusy || !selectedColumn}
          mode='single'
          onChange={(values) => {
            setSelectedFn(values[0] ?? '');
          }}
          options={fnOptions}
          placeholder='Select a function...'
          selected={selectedOption ? [selectedOption.value] : []}
        />
      )}
      <Button
        isBusy={isBusy}
        isDisabled={!selectedColumn || selectedOption === undefined}
        onClick={handleAddAggregate}
        variant='primary'
      >
        Add
      </Button>
    </div>
  );
};
