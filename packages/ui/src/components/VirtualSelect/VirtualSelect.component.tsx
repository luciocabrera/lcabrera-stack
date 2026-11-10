import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { VirtualSelectProvider } from './contexts';
import { useVirtualSelect } from './hooks';
import { styles } from './VirtualSelect.stylex';
import { VirtualSelectDropdown } from './VirtualSelectDropdown/VirtualSelectDropdown.component';
import { VirtualSelectHeader } from './VirtualSelectHeader/VirtualSelectHeader.component';
import { VirtualSelectHiddenInputs } from './VirtualSelectHiddenInputs/VirtualSelectHiddenInputs.component';
import { VirtualSelectLabel } from './VirtualSelectLabel/VirtualSelectLabel.component';

// fallow-ignore-next-line complexity -- false positive, case FP-0002: prop count of a required public API; no branching to remove
export const VirtualSelect = ({
  attachedEdge,
  customStylex,
  dataState,
  isAlwaysOpen = false,
  isBusy = false,
  isDisabled = false,
  label,
  listboxId,
  listMaxHeight,
  mode,
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
  onOpenChange,
  options = [],
  placeholder = 'Select...',
  placement,
  selected,
  shouldFillHeight = false,
}: VirtualSelectProps) => {
  const { containerRef, selectedLabels, ...shell } = useVirtualSelect({
    dataState,
    isAlwaysOpen,
    isBusy,
    isDisabled,
    label,
    listboxId,
    mode,
    onChange,
    onOpenChange,
    options,
    selected,
  });

  return (
    <VirtualSelectProvider
      anchorRef={containerRef}
      dataState={shell.effectiveDataState}
      filter={{ type: 'select', values: selectedLabels }}
      listState={{
        hasCheckboxes: shell.isMulti,
        hasSelectAll: shell.isMulti,
        listMaxHeight,
        onChange: shell.handleListChange,
        onFetchInitial,
        onFetchMore,
        shouldFillHeight,
      }}
      metaState={{
        attachedEdge,
        customStylex,
        isAlwaysOpen,
        isBusy,
        isDisabled,
        isOpen: shell.isOpen,
        labelId: shell.labelId,
        listboxId: shell.resolvedListboxId,
        mode,
        onCloseDropdown: shell.closeDropdown,
        onToggleDropdown: shell.toggleDropdown,
        placeholder,
        placement,
      }}
    >
      <div
        ref={containerRef}
        {...stylex.props(
          styles.container,
          shouldFillHeight ? styles.containerFill : undefined,
        )}
      >
        <VirtualSelectLabel label={label} />
        <VirtualSelectHeader />
        <VirtualSelectDropdown />
        <VirtualSelectHiddenInputs name={name} selected={selected} />
      </div>
    </VirtualSelectProvider>
  );
};
