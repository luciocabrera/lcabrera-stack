import { useToggleOption } from '@repo/ui/components/VirtualList/contexts/VirtualListData/data/actions';
import { useGetSelectedValues } from '@repo/ui/components/VirtualList/contexts/VirtualListData/data/selectors';
import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { VirtualSelectHeaderProps } from './VirtualSelectHeader.types';

import { useVirtualSelectTagOverflow } from '../hooks';
import { resolveTagOverflow } from '../utils';
import { VirtualSelectTrigger } from '../VirtualSelectTrigger';
import { busyStyles } from './VirtualSelectHeader.stylex';

/**
 * Header slice of VirtualSelect: the busy shimmer overlay plus the combobox
 * trigger. Self-connected — reads the selected labels from the list data
 * store, owns the trigger ref + tag-overflow measurement, and dispatches
 * tag removal through the toggle-option action.
 */
export const VirtualSelectHeader = ({
  isAlwaysOpen,
  isBusy = false,
  isOpen,
  listboxId,
  mode,
  onToggle,
  placeholder,
}: VirtualSelectHeaderProps) => {
  const triggerRef = useRef<HTMLButtonElement | HTMLDivElement | undefined>(
    undefined,
  );

  const selectedLabels = useGetSelectedValues();
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
        onToggle={onToggle}
        overflowCount={overflowCount}
        placeholder={placeholder}
        selected={selectedLabels}
        triggerRef={triggerRef}
        visibleTags={visibleTags}
      />
    </>
  );
};
