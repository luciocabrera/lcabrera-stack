import { VirtualListContent } from '@repo/ui/components/VirtualList';
import * as stylex from '@stylexjs/stylex';

import {
  useGetCustomStylex,
  useGetIsAlwaysOpen,
  useGetIsListVisible,
  useGetListboxId,
  useGetListMaxHeight,
  useGetShouldFillHeight,
} from '../contexts/VirtualSelectConfig/meta/selectors';
import { getDropdownStyle } from './utils/getDropdownStyle.util';
import { styles } from './VirtualSelectDropdown.stylex';

/**
 * Dropdown slice of VirtualSelect: the positioned listbox shell around the
 * provider-less VirtualListContent. Fully self-connected (zero props) —
 * positioning and visibility come from the select meta selectors; the list
 * providers and the selection-change mapping are owned by the shell.
 */
export const VirtualSelectDropdown = () => {
  const customStylex = useGetCustomStylex();
  const isAlwaysOpen = useGetIsAlwaysOpen();
  const isListVisible = useGetIsListVisible();
  const listboxId = useGetListboxId();
  const listMaxHeight = useGetListMaxHeight();
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
      <VirtualListContent
        listMaxHeight={listMaxHeight}
        shouldFillHeight={shouldFillHeight}
      />
    </div>
  );
};
