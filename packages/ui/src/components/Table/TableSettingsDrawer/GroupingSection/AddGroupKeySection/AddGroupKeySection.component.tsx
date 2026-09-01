import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '#ui/components/Button';
import { InfoBox } from '#ui/components/InfoBox';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import {
  useGetTableGroupingCapabilities,
  useGetTableIsGroupingLocked,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { resolveGroupKeyAvailability } from '#ui/components/Table/utils/resolveGroupKeyAvailability.util';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddGroupKeySectionProps } from './AddGroupKeySection.types';

import { useToggleGroupKey } from '../../TableDrawerContext/actions';
import { useGetGroupingKeys } from '../../TableDrawerContext/selectors';
import { toGroupKeyColumnOptions } from '../utils';
import { styles } from './AddGroupKeySection.stylex';

export const AddGroupKeySection = ({
  isBusy = false,
  onDropdownOpenChange,
}: AddGroupKeySectionProps) => {
  const columns = useGetColumns();
  const capabilities = useGetTableGroupingCapabilities();
  const groupingKeys = useGetGroupingKeys();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const toggleGroupKey = useToggleGroupKey();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (isGroupingLocked) return;

  const isAtDepthCap = groupingKeys.length >= MAX_TABLE_GROUP_KEYS;

  const handleOpenChange = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    onDropdownOpenChange?.(isOpen);
  };

  const availableColumnOptions = toGroupKeyColumnOptions({
    capabilities,
    columns,
    stagedKeys: new Set(groupingKeys),
  });

  const handleAddGroupKey = () => {
    if (!selectedColumn) return;

    toggleGroupKey({
      columnKey: selectedColumn,
      period: resolveGroupKeyAvailability({
        capability: capabilities[selectedColumn],
        column: columns.find(
          (candidate) => String(candidate.key) === selectedColumn,
        ),
      }).requiredPeriod,
    });
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
