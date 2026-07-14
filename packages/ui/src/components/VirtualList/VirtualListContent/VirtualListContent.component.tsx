import * as stylex from '@stylexjs/stylex';

import { useGetShouldFillHeight } from '../contexts/list/selectors';
import { styles } from '../VirtualList.stylex';
import { VirtualListBody } from '../VirtualListBody';
import { VirtualListFooter } from '../VirtualListFooter';
import { VirtualListHeader } from '../VirtualListHeader';

/**
 * Provider-less composition of the VirtualList regions: the container plus
 * the self-connected Header/Body/Footer delegates. Fully self-connected
 * (zero props) — layout config comes from the list store. Must render
 * inside `VirtualListProvider` — mounted either by `VirtualList` itself or
 * composed by a host provider (e.g. `VirtualSelectProvider`).
 */
export const VirtualListContent = () => {
  const shouldFillHeight = useGetShouldFillHeight();

  return (
    <div
      {...stylex.props(
        styles.container,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <VirtualListHeader />
      <VirtualListBody />
      <VirtualListFooter />
    </div>
  );
};
