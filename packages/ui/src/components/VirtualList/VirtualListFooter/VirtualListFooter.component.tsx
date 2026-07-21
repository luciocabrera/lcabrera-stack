import {
  ListAllIcon,
  ListCheckedIcon,
  ListUncheckedIcon,
} from '@lcabrera/ui/components/Icons';
import { ICON_SIZE_MD } from '@lcabrera/ui/design-system/constants';
import * as stylex from '@stylexjs/stylex';

import {
  useGetIsLoading,
  useGetIsLoadingMore,
  useGetLoadedCount,
  useGetSelectedCount,
  useGetTotalCount,
} from '../contexts/data/selectors';
import { useGetHasCheckboxes } from '../contexts/list/selectors';
import { ListFilterModeButton } from './ListFilterModeButton';
import { styles } from './VirtualListFooter.stylex';

/** Self-connected footer: loaded/total counts plus the filter-mode buttons. */
export const VirtualListFooter = () => {
  const hasCheckboxes = useGetHasCheckboxes();
  const isLoading = useGetIsLoading();
  const isLoadingMore = useGetIsLoadingMore();
  const loadedCount = useGetLoadedCount();
  const selectedCount = useGetSelectedCount();
  const totalCount = useGetTotalCount();

  if (loadedCount === 0) return;
  const modes = ['all', 'selected', 'unselected'] as const;
  const modeConfig = {
    all: {
      count: loadedCount,
      icon: <ListAllIcon size={ICON_SIZE_MD} />,
      tooltip: 'Show all options',
    },
    selected: {
      count: selectedCount,
      icon: <ListCheckedIcon size={ICON_SIZE_MD} />,
      tooltip: 'Show only selected options',
    },
    unselected: {
      count: loadedCount - selectedCount,
      icon: <ListUncheckedIcon size={ICON_SIZE_MD} />,
      tooltip: 'Show only unselected options',
    },
  } as const;
  return (
    <div {...stylex.props(styles.footer)}>
      <p {...stylex.props(styles.loadedCount)}>
        Loaded: {loadedCount}
        {totalCount && Number.isFinite(totalCount) ? ` / ${totalCount}` : ''}
        {isLoading && ' — Loading...'}
        {isLoadingMore && ' — Loading more...'}
      </p>
      {hasCheckboxes && (
        <div {...stylex.props(styles.listFilterGroup)}>
          {modes.map((mode) => {
            const { count, icon, tooltip } = modeConfig[mode];
            return (
              <ListFilterModeButton
                count={count}
                icon={icon}
                key={mode}
                mode={mode}
                tooltip={tooltip}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
