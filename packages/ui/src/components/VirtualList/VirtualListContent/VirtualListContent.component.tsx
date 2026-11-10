import * as stylex from '@stylexjs/stylex';

import { useGetShouldFillHeight } from '../contexts/list/selectors';
import { styles } from '../VirtualList.stylex';
import { VirtualListBody } from '../VirtualListBody';
import { VirtualListFooter } from '../VirtualListFooter';
import { VirtualListHeader } from '../VirtualListHeader';

export const VirtualListContent = () => {
  const shouldFillHeight = useGetShouldFillHeight();

  return (
    <div
      {...stylex.props(
        styles.container,
        styles.containerShrinkable,
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <div
        {...stylex.props(
          styles.group,
          shouldFillHeight ? styles.containerFill : undefined,
        )}
      >
        <VirtualListHeader />
        <VirtualListBody />
      </div>
      <VirtualListFooter />
    </div>
  );
};
