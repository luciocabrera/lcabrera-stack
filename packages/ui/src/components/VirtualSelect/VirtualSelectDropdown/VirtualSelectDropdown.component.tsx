import { VirtualListContent } from '@repo/ui/components/VirtualList';
import { useGetShouldFillHeight } from '@repo/ui/components/VirtualList/contexts/list/selectors';
import * as stylex from '@stylexjs/stylex';

import {
  useGetCustomStylex,
  useGetIsAlwaysOpen,
  useGetIsListVisible,
  useGetListboxId,
} from '../contexts/meta/selectors';
import { getDropdownStyle } from './utils/getDropdownStyle.util';
import { styles } from './VirtualSelectDropdown.stylex';

/**
 * Dropdown slice of VirtualSelect: the positioned listbox shell around the
 * provider-less VirtualListContent. Fully self-connected (zero props) —
 * positioning/visibility come from the select meta selectors and the
 * fill-height flag from the list config store; the list providers and the
 * selection-change mapping are owned by the shell.
 */
export const VirtualSelectDropdown = () => {
  const customStylex = useGetCustomStylex();
  const isAlwaysOpen = useGetIsAlwaysOpen();
  const isListVisible = useGetIsListVisible();
  const listboxId = useGetListboxId();
  const shouldFillHeight = useGetShouldFillHeight();

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
      <VirtualListContent />
    </div>
  );
};
