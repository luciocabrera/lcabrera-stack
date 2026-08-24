import type { VirtualListProps } from './VirtualList.types';

import { VirtualListProvider } from './contexts';
import { VirtualListContent } from './VirtualListContent';

/**
 * Thin shell over the VirtualList context: mounts the single VirtualListProvider (grouping
 * the config/callback props into `listState`) and renders the provider-less, zero-prop
 * VirtualListContent composition.
 */
export const VirtualList = ({
  dataState,
  filter,
  ...listState
}: VirtualListProps) => (
  <VirtualListProvider
    dataState={dataState}
    filter={filter}
    listState={listState}
  >
    <VirtualListContent />
  </VirtualListProvider>
);
