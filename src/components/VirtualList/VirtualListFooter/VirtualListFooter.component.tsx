import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import {
  ListAllIcon,
  ListCheckedIcon,
  ListUncheckedIcon,
} from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { VirtualListFooterProps } from './VirtualListFooter.types';

import { styles } from '../VirtualList.stylex';

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
            const icon =
              mode === 'all' ? (
                <ListAllIcon size={ICON_SIZE_MD} />
              ) : mode === 'selected' ? (
                <ListCheckedIcon size={ICON_SIZE_MD} />
              ) : (
                <ListUncheckedIcon size={ICON_SIZE_MD} />
              );
            const count =
              mode === 'all'
                ? effectiveOptions.length
                : mode === 'selected'
                  ? selectedValues.length
                  : effectiveOptions.length - selectedValues.length;
            const tooltipLabel =
              mode === 'all'
                ? 'Show all options'
                : mode === 'selected'
                  ? 'Show only selected options'
                  : 'Show only unselected options';
            const tooltipContent = `${tooltipLabel} (${count})`;
            return (
              <Button
                color={listFilterMode === mode ? 'secondary' : 'ghost'}
                icon={icon}
                key={mode}
                onClick={() => {
                  setListFilterMode(mode);
                }}
                size='mini'
                tooltipContent={tooltipContent}
                variant='flat'
                width='auto'
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
