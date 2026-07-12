import * as stylex from '@stylexjs/stylex';

import type { VirtualListProps } from './VirtualList.types';

import { VirtualListConfigProvider, VirtualListDataProvider } from './contexts';
import { LIST_MAX_HEIGHT } from './VirtualList.constants';
import { styles } from './VirtualList.stylex';
import { VirtualListBody } from './VirtualListBody';
import { VirtualListFooter } from './VirtualListFooter';
import { VirtualListHeader } from './VirtualListHeader';

/**
 * Thin shell over the VirtualList contexts: applies prop defaults, mounts
 * the Config and Data providers (in that order), and composes the
 * self-connected Header/Body/Footer delegates.
 */
export const VirtualList = ({
  dataState,
  filter,
  hasCheckboxes = true,
  hasSelectAll = true,
  listMaxHeight = LIST_MAX_HEIGHT,
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
  shouldFillHeight = false,
}: VirtualListProps) => (
  <VirtualListConfigProvider
    hasCheckboxes={hasCheckboxes}
    hasSelectAll={hasSelectAll}
    name={name}
    onChange={onChange}
    onFetchInitial={onFetchInitial}
    onFetchMore={onFetchMore}
  >
    <VirtualListDataProvider
      dataState={dataState}
      filter={filter}
      hasSelectAll={hasSelectAll}
      onFetchInitial={onFetchInitial}
    >
      <div
        {...stylex.props(
          styles.container,
          shouldFillHeight ? styles.containerFill : undefined,
        )}
      >
        <VirtualListHeader />
        <VirtualListBody
          listMaxHeight={listMaxHeight}
          shouldFillHeight={shouldFillHeight}
        />
        <VirtualListFooter />
      </div>
    </VirtualListDataProvider>
  </VirtualListConfigProvider>
);
