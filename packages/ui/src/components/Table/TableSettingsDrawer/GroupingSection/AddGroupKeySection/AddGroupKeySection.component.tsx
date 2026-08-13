import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '#ui/components/Button';
import { InfoBox } from '#ui/components/InfoBox';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetTableGroupingCapabilities } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddGroupKeySectionProps } from './AddGroupKeySection.types';

import { useToggleGroupKey } from '../../TableDrawerContext/actions';
import { useGetGroupingKeys } from '../../TableDrawerContext/selectors';
import { toGroupKeyColumnOptions } from '../utils';
import { styles } from './AddGroupKeySection.stylex';

/**
 * The drawer's "add a group key" control: the columns that may still be a group
 * key, and an Add button that appends the chosen one as the innermost level.
 *
 * Which columns those are is `toGroupKeyColumnOptions`' answer, so this list and
 * the header menu's enabled items come from one derivation — the column's own
 * declaration narrowed by the catalogue (ADR-058, #642). Offering a key the
 * endpoint refuses would empty the table instead of grouping it.
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
  const capabilities = useGetTableGroupingCapabilities();
  const groupingKeys = useGetGroupingKeys();
  const toggleGroupKey = useToggleGroupKey();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isAtDepthCap = groupingKeys.length >= MAX_TABLE_GROUP_KEYS;

  const handleOpenChange = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    onDropdownOpenChange?.(isOpen);
  };

  const availableColumnOptions = toGroupKeyColumnOptions({
    capabilities,
    columns,
    // A Set rather than `groupingKeys.includes` inside the filter: the filter is
    // the loop, so an array scan per column is quadratic in the column count.
    stagedKeys: new Set(groupingKeys),
  });

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
