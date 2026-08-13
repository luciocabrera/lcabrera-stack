import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '#ui/components/Button';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';
import {
  isTableAggregateFn,
  orderLegalAggregates,
} from '#ui/components/Table/utils';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddAggregateSectionProps } from './AddAggregateSection.types';

import { useSetColumnAggregate } from '../../TableDrawerContext/actions';
import { toAggregatableColumnOptions } from '../utils';
import { styles } from './AddAggregateSection.stylex';

/**
 * The drawer's "add an aggregate" control: a column, then a function that is
 * legal for that column's **real** type.
 *
 * Both lists come from the catalogue capability the loader shipped (ADR-058,
 * ADR-063) and from nothing else, and the second is derived from the first — so
 * the function list cannot offer something the chosen column does not support,
 * whichever way the two are picked.
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
  const setColumnAggregate = useSetColumnAggregate();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedFn, setSelectedFn] = useState('');

  const columnOptions = toAggregatableColumnOptions({ capabilities, columns });
  const fnOptions = orderLegalAggregates({
    legal: capabilities[selectedColumn]?.aggregates ?? [],
  }).map((fn) => ({ label: TABLE_AGGREGATE_LABELS[fn], value: fn }));

  const handleColumnChange = (values: readonly string[]) => {
    setSelectedColumn(values[0] ?? '');
    // The function list is derived from the column, so a function chosen for
    // the previous one may not exist for this one.
    setSelectedFn('');
  };

  const handleAddAggregate = () => {
    if (!selectedColumn || !isTableAggregateFn(selectedFn)) return;

    setColumnAggregate({ columnKey: selectedColumn, fn: selectedFn });
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
