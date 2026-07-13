import * as stylex from '@stylexjs/stylex';

import { useGetShouldFillHeight } from '../contexts/VirtualListConfig/config/selectors';
import { styles } from '../VirtualList.stylex';
import { VirtualListBody } from '../VirtualListBody';
import { VirtualListFooter } from '../VirtualListFooter';
import { VirtualListHeader } from '../VirtualListHeader';

/**
 * Provider-less composition of the VirtualList regions: the container plus
 * the self-connected Header/Body/Footer delegates. Fully self-connected
 * (zero props) — layout config comes from the config store. Must render
 * inside `VirtualListConfigProvider` and `VirtualListDataProvider` —
 * mounted either by `VirtualList` itself or lifted into a composing
 * component (e.g. `VirtualSelect`).
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
