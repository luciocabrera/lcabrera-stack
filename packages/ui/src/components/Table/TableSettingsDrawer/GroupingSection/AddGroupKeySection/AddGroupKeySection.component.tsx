import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '#ui/components/Button';
import { InfoBox } from '#ui/components/InfoBox';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useToggleTableGroupKey } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddGroupKeySectionProps } from './AddGroupKeySection.types';

import { styles } from './AddGroupKeySection.stylex';

/**
 * The drawer's "add a group key" control: the groupable columns not already
 * applied, and an Add button that appends the chosen one as the innermost
 * level.
 *
 * At `MAX_TABLE_GROUP_KEYS` the control is replaced by a message saying so
 * rather than left enabled to be refused — `resolveTableGroupingUpdate` would
 * refuse it, and an affordance that silently does nothing reads as a bug.
 */
export const AddGroupKeySection = ({
  isBusy = false,
  onDropdownOpenChange,
}: AddGroupKeySectionProps) => {
  const columns = useGetColumns();
  const groupingKeys = useGetTableGroupingKeys();
  const toggleGroupKey = useToggleTableGroupKey();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isAtDepthCap = groupingKeys.length >= MAX_TABLE_GROUP_KEYS;

  const handleOpenChange = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    onDropdownOpenChange?.(isOpen);
  };

  // A Set rather than `groupingKeys.includes` inside the filter: the filter is
  // the loop, so an array scan per column is quadratic in the column count.
  const appliedKeys = new Set(groupingKeys);
  const availableColumnOptions = columns
    .filter(
      (column) =>
        resolveColumnCapabilities(column).isGroupable &&
        !appliedKeys.has(String(column.key)),
    )
    .map((column) => ({ label: column.label, value: String(column.key) }));

  const handleAddGroupKey = () => {
    if (!selectedColumn) return;

    toggleGroupKey(selectedColumn);
    setSelectedColumn('');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader title='Add Group Key' />
      {isAtDepthCap ? (
        <InfoBox>
          {`Grouping is limited to ${MAX_TABLE_GROUP_KEYS} keys. Remove one to add another.`}
        </InfoBox>
      ) : (
        <>
          <VirtualSelect
            isBusy={isBusy}
            mode='single'
            onChange={(values) => {
              setSelectedColumn(values[0] ?? '');
            }}
            onOpenChange={handleOpenChange}
            options={availableColumnOptions}
            placeholder='Select a column...'
            selected={selectedColumn ? [selectedColumn] : []}
          />
          {!isDropdownOpen && (
            <Button
              isBusy={isBusy}
              isDisabled={!selectedColumn}
              onClick={handleAddGroupKey}
              variant='primary'
            >
              Add
            </Button>
          )}
        </>
      )}
    </div>
  );
};
