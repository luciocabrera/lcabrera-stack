import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectProps } from './VirtualSelect.types';

import { VirtualSelectProvider } from './contexts';
import { useVirtualSelect } from './hooks';
import { styles } from './VirtualSelect.stylex';
import { VirtualSelectDropdown } from './VirtualSelectDropdown/VirtualSelectDropdown.component';
import { VirtualSelectHeader } from './VirtualSelectHeader/VirtualSelectHeader.component';

export const VirtualSelect = ({
  customStylex,
  dataState,
  isAlwaysOpen = false,
  isBusy = false,
  isDisabled = false,
  listboxId,
  listMaxHeight,
  mode,
  onChange,
  onFetchInitial,
  onFetchMore,
  onOpenChange,
  options = [],
  placeholder = 'Select...',
  selected,
  shouldFillHeight = false,
}: VirtualSelectProps) => {
  const {
    closeDropdown,
    containerRef,
    effectiveDataState,
    handleListChange,
    isMulti,
    isOpen,
    resolvedListboxId,
    selectedLabels,
    toggleDropdown,
  } = useVirtualSelect({
    dataState,
    isAlwaysOpen,
    isBusy,
    isDisabled,
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
      dataState={effectiveDataState}
      filter={{ type: 'select', values: selectedLabels }}
      listState={{
        hasCheckboxes: isMulti,
        hasSelectAll: isMulti,
        listMaxHeight,
        onChange: handleListChange,
        onFetchInitial,
        onFetchMore,
        shouldFillHeight,
      }}
      metaState={{
        customStylex,
        isAlwaysOpen,
        isBusy,
        isDisabled,
        isOpen,
        listboxId: resolvedListboxId,
        mode,
        onCloseDropdown: closeDropdown,
        onToggleDropdown: toggleDropdown,
        placeholder,
      }}
    >
      <div
        ref={containerRef}
        {...stylex.props(
          styles.container,
          shouldFillHeight ? styles.containerFill : undefined,
        )}
      >
        <VirtualSelectHeader />
        <VirtualSelectDropdown />
      </div>
    </VirtualSelectProvider>
  );
};
