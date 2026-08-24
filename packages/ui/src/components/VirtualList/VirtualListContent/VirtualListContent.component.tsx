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
        shouldFillHeight ? styles.containerFill : undefined,
      )}
    >
      <VirtualListHeader />
      <VirtualListBody />
      <VirtualListFooter />
    </div>
  );
};
