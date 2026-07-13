import { useToggleOption } from '@repo/ui/components/VirtualList/contexts/VirtualListData/data/actions';
import { useGetSelectedValues } from '@repo/ui/components/VirtualList/contexts/VirtualListData/data/selectors';
import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import { useToggleDropdown } from '../contexts/VirtualSelectConfig/meta/actions';
import {
  useGetIsAlwaysOpen,
  useGetIsBusy,
  useGetIsOpen,
  useGetListboxId,
  useGetMode,
  useGetPlaceholder,
} from '../contexts/VirtualSelectConfig/meta/selectors';
import { useVirtualSelectTagOverflow } from '../hooks';
import { resolveTagOverflow } from '../utils';
import { VirtualSelectTrigger } from '../VirtualSelectTrigger';
import { busyStyles } from './VirtualSelectHeader.stylex';

/**
 * Header slice of VirtualSelect: the busy shimmer overlay plus the combobox
 * trigger. Fully self-connected (zero props) — presentation metadata comes
 * from the select meta selectors, the selected labels from the list data
 * store, and tag removal/dropdown toggling dispatch through actions. Owns
 * the trigger ref + tag-overflow measurement.
 */
export const VirtualSelectHeader = () => {
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement | undefined>(
    undefined,
  );

  const isAlwaysOpen = useGetIsAlwaysOpen();
  const isBusy = useGetIsBusy();
  const isOpen = useGetIsOpen();
  const listboxId = useGetListboxId();
  const mode = useGetMode();
  const placeholder = useGetPlaceholder();
  const selectedLabels = useGetSelectedValues();
  const toggleDropdown = useToggleDropdown();
  const toggleOption = useToggleOption();

  const visibleTagCount = useVirtualSelectTagOverflow({
    mode,
    selected: selectedLabels,
    triggerRef,
  });

  const { overflowCount, visibleTags } = resolveTagOverflow({
    mode,
    selectedLabels,
    visibleTagCount,
  });

  return (
    <>
      {isBusy && (
        <div {...stylex.props(busyStyles.overlay)} aria-hidden='true'>
          <div {...stylex.props(busyStyles.wave)} />
        </div>
      )}
      <VirtualSelectTrigger
        isAlwaysOpen={isAlwaysOpen}
        isBusy={isBusy}
        isOpen={isOpen}
        listboxId={listboxId}
        mode={mode}
        onRemoveTag={toggleOption}
        onToggle={toggleDropdown}
        overflowCount={overflowCount}
        placeholder={placeholder}
        selected={selectedLabels}
        triggerRef={triggerRef}
        visibleTags={visibleTags}
      />
    </>
  );
};
