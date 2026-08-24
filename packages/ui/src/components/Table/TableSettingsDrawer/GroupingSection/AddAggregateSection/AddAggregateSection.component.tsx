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
 * Both lists rest on `resolveOfferableAggregates` — the column list through
 * `toAggregatableColumnOptions`, the function list through `resolveAddableAggregates`,
 * which reaches it via `resolveAffordableAggregates` — so the second cannot offer
 * something the chosen column does not support, whichever way the two are picked, and
 * neither can disagree with the column header menu, which resolves through the same pair
 * (#830, #842).
 * What that predicate answers with is the catalogue capability the loader shipped
 * (ADR-058, ADR-063), minus any column staged as a group key (ADR-080).
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
