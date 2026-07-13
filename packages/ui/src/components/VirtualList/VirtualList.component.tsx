import type { VirtualListProps } from './VirtualList.types';

import { VirtualListConfigProvider, VirtualListDataProvider } from './contexts';
import { VirtualListContent } from './VirtualListContent';

/**
 * Thin shell over the VirtualList contexts: applies prop defaults, mounts
 * the Config and Data providers (in that order), and renders the
 * provider-less VirtualListContent composition. Composing components
 * (e.g. VirtualSelect) may instead mount the providers themselves and
 * render VirtualListContent directly.
 */
export const VirtualList = ({
  dataState,
  filter,
  hasCheckboxes = true,
  hasSelectAll = true,
  listMaxHeight,
  name,
  onChange,
  onFetchInitial,
  onFetchMore,
  shouldFillHeight,
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
      <VirtualListContent
        listMaxHeight={listMaxHeight}
        shouldFillHeight={shouldFillHeight}
      />
    </VirtualListDataProvider>
  </VirtualListConfigProvider>
);
