import { VirtualListContent } from '@repo/ui/components/VirtualList';
import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectDropdownProps } from './VirtualSelectDropdown.types';

import { getDropdownStyle } from './utils/getDropdownStyle.util';
import { styles } from './VirtualSelectDropdown.stylex';

/**
 * Dropdown slice of VirtualSelect: the positioned listbox shell around the
 * provider-less VirtualListContent. Presentation only — the list providers
 * and the selection-change mapping are owned by the VirtualSelect shell.
 */
export const VirtualSelectDropdown = ({
  customStylex,
  isAlwaysOpen,
  isListVisible,
  listboxId,
  listMaxHeight,
  shouldFillHeight,
}: VirtualSelectDropdownProps) => {
  if (!isListVisible) return;

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
      <VirtualListContent
        listMaxHeight={listMaxHeight}
        shouldFillHeight={shouldFillHeight}
      />
    </div>
  );
};
