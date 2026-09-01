import type { VirtualListProps } from './VirtualList.types';

import { VirtualListProvider } from './contexts';
import { VirtualListContent } from './VirtualListContent';

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
