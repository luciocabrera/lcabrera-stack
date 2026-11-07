import * as stylex from '@stylexjs/stylex';

import { Text } from '#ui/components/Text';

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
    labelId,
    resolvedListboxId,
    selectedLabels,
    toggleDropdown,
  } = useVirtualSelect({
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
        labelId,
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
        {label !== undefined && (
          <Text
            as='span'
            customStylex={styles.label}
            id={labelId}
            size='sm'
            weight='medium'
          >
            {label}
          </Text>
        )}
        <VirtualSelectHeader />
        <VirtualSelectDropdown />
        {name !== undefined &&
          selected.map((value) => (
            <input key={value} name={name} type='hidden' value={value} />
          ))}
      </div>
    </VirtualSelectProvider>
  );
};
