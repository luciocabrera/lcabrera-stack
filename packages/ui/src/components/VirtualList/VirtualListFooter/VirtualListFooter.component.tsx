import {
  ListAllIcon,
  ListCheckedIcon,
  ListUncheckedIcon,
} from '@repo/ui/components/Icons';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import type { VirtualListFooterProps } from './VirtualListFooter.types';

import { ListFilterModeButton } from './ListFilterModeButton';
import { styles } from './VirtualListFooter.stylex';

export const VirtualListFooter = ({
  dataState,
  effectiveOptions,
  hasCheckboxes,
  listFilterMode,
  selectedValues,
  setListFilterMode,
}: VirtualListFooterProps) => {
  if (dataState.data.length === 0) return;

  return (
    <div {...stylex.props(styles.footer)}>
      <p {...stylex.props(styles.loadedCount)}>
        Loaded: {dataState.data.length}
        {Number.isFinite(dataState.totalCount) && dataState.totalCount
          ? ` / ${dataState.totalCount}`
          : ''}
        {dataState.isLoading && ' — Loading...'}
        {dataState.isLoadingMore && ' — Loading more...'}
      </p>
      {hasCheckboxes && (
        <div {...stylex.props(styles.listFilterGroup)}>
          {(['all', 'selected', 'unselected'] as const).map((mode) => {
            const modeConfig = {
              all: {
                count: effectiveOptions.length,
                icon: <ListAllIcon size={ICON_SIZE_MD} />,
                tooltip: 'Show all options',
              },
              selected: {
                count: selectedValues.length,
                icon: <ListCheckedIcon size={ICON_SIZE_MD} />,
                tooltip: 'Show only selected options',
              },
              unselected: {
                count: effectiveOptions.length - selectedValues.length,
                icon: <ListUncheckedIcon size={ICON_SIZE_MD} />,
                tooltip: 'Show only unselected options',
              },
            } as const;
            const { count, icon, tooltip } = modeConfig[mode];
            return (
              <ListFilterModeButton
                count={count}
                icon={icon}
                isActive={listFilterMode === mode}
                key={mode}
                mode={mode}
                onSelect={setListFilterMode}
                tooltip={tooltip}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
