import * as stylex from '@stylexjs/stylex';

import type { VirtualListContentProps } from './VirtualListContent.types';

import { LIST_MAX_HEIGHT } from '../VirtualList.constants';
import { styles } from '../VirtualList.stylex';
import { VirtualListBody } from '../VirtualListBody';
import { VirtualListFooter } from '../VirtualListFooter';
import { VirtualListHeader } from '../VirtualListHeader';

/**
 * Provider-less composition of the VirtualList regions: the container plus
 * the self-connected Header/Body/Footer delegates. Must render inside
 * `VirtualListConfigProvider` and `VirtualListDataProvider` — mounted either
 * by `VirtualList` itself or lifted into a composing component
 * (e.g. `VirtualSelect`).
 */
export const VirtualListContent = ({
  listMaxHeight = LIST_MAX_HEIGHT,
  shouldFillHeight = false,
}: VirtualListContentProps) => (
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
);
