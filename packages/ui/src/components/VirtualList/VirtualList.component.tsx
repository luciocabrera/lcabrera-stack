import type { VirtualListProps } from './VirtualList.types';

import { VirtualListConfigProvider, VirtualListDataProvider } from './contexts';
import { VirtualListContent } from './VirtualListContent';

/**
 * Thin shell over the VirtualList contexts: mounts the Config and Data
 * providers (in that order — the config provider is the single prop intake
 * for all config, layout, and callbacks) and renders the provider-less,
 * zero-prop VirtualListContent composition. Composing components
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
    listMaxHeight={listMaxHeight}
    name={name}
    onChange={onChange}
    onFetchInitial={onFetchInitial}
    onFetchMore={onFetchMore}
    shouldFillHeight={shouldFillHeight}
  >
    <VirtualListDataProvider dataState={dataState} filter={filter}>
      <VirtualListContent />
    </VirtualListDataProvider>
  </VirtualListConfigProvider>
);
