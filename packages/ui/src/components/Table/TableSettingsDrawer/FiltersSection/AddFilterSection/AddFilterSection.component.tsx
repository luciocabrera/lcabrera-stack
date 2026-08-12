import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddFilterSectionProps } from './AddFilterSection.types';

import { styles } from './AddFilterSection.stylex';
import { useAddFilterSection } from './useAddFilterSection.hook';

/**
 * Column picker + Add button for creating a new drawer filter. Purely
 * presentational: all store wiring, selection state, and the add-filter
 * flow live in useAddFilterSection; only the dropdown-open presentation
 * callback is received from the shell (overlay coordination).
 */
export const AddFilterSection = ({
  isBusy = false,
  onDropdownOpenChange,
}: AddFilterSectionProps) => {
  const {
    filterableColumnOptions,
    handleAddFilter,
    handleOpenChange,
    handleVirtualSelectChange,
    isDropdownOpen,
    selectedColumn,
  } = useAddFilterSection({ onDropdownOpenChange });

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader title='Add Filter' />
      <VirtualSelect
        isBusy={isBusy}
        mode='single'
        onChange={handleVirtualSelectChange}
        onOpenChange={handleOpenChange}
        options={filterableColumnOptions}
        placeholder='Select a column...'
        selected={selectedColumn ? [selectedColumn] : []}
      />
      {!isDropdownOpen && (
        <Button
          isBusy={isBusy}
          isDisabled={!selectedColumn}
          onClick={handleAddFilter}
          variant='primary'
        >
          Add
        </Button>
      )}
    </div>
  );
};
