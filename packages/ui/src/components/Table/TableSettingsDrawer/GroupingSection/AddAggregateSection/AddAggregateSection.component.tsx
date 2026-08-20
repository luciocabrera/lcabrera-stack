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
import { AGGREGATE_PICKER_GAP_MESSAGES } from './AddAggregateSection.constants';
import { styles } from './AddAggregateSection.stylex';

/**
 * The drawer's "add an aggregate" control: a column, then a function that may
 * be offered for it.
 *
 * Both lists rest on `resolveOfferableAggregates` — the column list through
 * `toAggregatableColumnOptions`, the function list through
 * `resolveAddableAggregates`, which reaches it via `resolveAffordableAggregates`
 * — so the second cannot offer something the chosen column does not support,
 * whichever way the two are picked, and neither can disagree with the column
 * header menu, which resolves through the same pair (#830, #842).
 * What that predicate answers with is the catalogue capability the loader
 * shipped (ADR-058, ADR-063), minus any column staged as a group key (ADR-080).
 *
 * A column may be picked more than once, with a different function each time
 * (#831) — but never the same function twice, so the functions already staged
 * on the chosen column are subtracted here and **not** in the shared predicate,
 * which the header menu reads and which must keep offering an applied function
 * as its toggle-off. `resolveAddableAggregates` owns that asymmetry (#841).
 *
 * A second `Distinct Count` is withheld too, and for a rule of a different
 * shape: the read carries one across every column together, so that answer
 * comes from `resolveAffordableAggregates` — which both surfaces resolve
 * through — rather than from anything per column (#842).
 *
 * **Where withholding empties the control, the control says why.** An empty
 * `VirtualSelect` beside a live-looking Add is the failure both of those issues
 * are about, and the two causes are not interchangeable: one is answered at this
 * column, the other at whichever column holds the distinct count. So the gap
 * carries its cause and the message is looked up from it, rather than the
 * component inferring one from an empty list.
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
  const { gap, options: fnOptions } = resolveAddableAggregates({
    applied: aggregates,
    capability: capabilities[selectedColumn],
    columnKey: selectedColumn,
    isGroupKey: stagedGroupKeys.has(selectedColumn),
  });
  const gapMessage =
    gap === undefined ? undefined : AGGREGATE_PICKER_GAP_MESSAGES[gap];
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
      {gapMessage === undefined ? (
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
      ) : (
        <InfoBox>{gapMessage}</InfoBox>
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
