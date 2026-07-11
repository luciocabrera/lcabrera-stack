import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectHeaderProps } from './VirtualSelectHeader.types';

import { VirtualSelectTrigger } from '../VirtualSelectTrigger';
import { busyStyles } from './VirtualSelectHeader.stylex';

/**
 * Header slice of VirtualSelect: the busy shimmer overlay plus the combobox
 * trigger. Owns tag removal — maps the removed tag's label back to its value
 * and reports the filtered selection through `onChange`.
 */
export const VirtualSelectHeader = ({
  getValueFromLabel,
  isAlwaysOpen,
  isBusy = false,
  isOpen,
  listboxId,
  mode,
  onChange,
  onToggle,
  overflowCount,
  placeholder,
  selected,
  triggerRef,
  visibleTags,
}: VirtualSelectHeaderProps) => {
  const handleRemoveTag = (label: string) => {
    const value = getValueFromLabel(label);
    onChange(selected.filter((v) => v !== value));
  };

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
        onRemoveTag={handleRemoveTag}
        onToggle={onToggle}
        overflowCount={overflowCount}
        placeholder={placeholder}
        selected={selected}
        triggerRef={triggerRef}
        visibleTags={visibleTags}
      />
    </>
  );
};
