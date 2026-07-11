import type { SelectFilter } from '@repo/ui/types/filterOperators.types';

import { VirtualList } from '@repo/ui/components/VirtualList';
import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectDropdownProps } from './VirtualSelectDropdown.types';

import { resolveVirtualSelectChange } from '../utils';
import { getDropdownStyle } from './utils/getDropdownStyle.util';
import { styles } from './VirtualSelectDropdown.stylex';

/**
 * Dropdown slice of VirtualSelect: the positioned listbox shell around
 * VirtualList. Owns selection changes — resolves the list filter to the next
 * selected values, reports them through `onChange`, and asks the parent to
 * close after a single-mode pick.
 */
export const VirtualSelectDropdown = ({
  customStylex,
  dataState,
  getValueFromLabel,
  isAlwaysOpen,
  isListVisible,
  listboxId,
  listMaxHeight,
  mode,
  onChange,
  onClose,
  onFetchInitial,
  onFetchMore,
  selected,
  selectedLabels,
  shouldFillHeight,
}: VirtualSelectDropdownProps) => {
  if (!isListVisible) return;

  const isMulti = mode === 'multi';

  const handleVirtualListChange = (filter?: SelectFilter) => {
    const { nextSelected, shouldCloseDropdown } = resolveVirtualSelectChange({
      filter,
      getValueFromLabel,
      mode,
      selected,
    });

    onChange([...nextSelected]);

    if (shouldCloseDropdown) {
      onClose();
    }
  };

  return (
    <div
      id={listboxId}
      role='listbox'
      {...stylex.props(
        styles.dropdownBase,
        getDropdownStyle({ isAlwaysOpen, shouldFillHeight }),
        customStylex,
      )}
    >
      <VirtualList
        dataState={dataState}
        filter={{ type: 'select', values: [...selectedLabels] }}
        hasCheckboxes={isMulti}
        hasSelectAll={isMulti}
        listMaxHeight={listMaxHeight}
        onChange={handleVirtualListChange}
        onFetchInitial={onFetchInitial}
        onFetchMore={onFetchMore}
        shouldFillHeight={shouldFillHeight}
      />
    </div>
  );
};
