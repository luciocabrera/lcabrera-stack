import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import {
  useGetListMaxHeight,
  useGetShouldFillHeight,
} from '../contexts/list/selectors';
import { useVirtualListInfiniteScroll } from './hooks/useVirtualListInfiniteScroll.hook';
import { styles } from './VirtualListBody.stylex';
import { VirtualListBodyChildren } from './VirtualListBodyChildren/VirtualListBodyChildren.component';

export const VirtualListBody = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const listMaxHeight = useGetListMaxHeight();
  const shouldFillHeight = useGetShouldFillHeight();

  const hasListEnd = useVirtualListInfiniteScroll({
    rootRef: scrollContainerRef,
    sentinelRef,
  });

  return (
    <div
      {...stylex.props(
        styles.optionsList,
        shouldFillHeight ? styles.optionsListFill : undefined,
      )}
    >
      <div
        ref={scrollContainerRef}
        {...stylex.props(
          shouldFillHeight
            ? styles.virtualContainerFill
            : styles.virtualContainer(listMaxHeight),
        )}
      >
        <VirtualListBodyChildren scrollContainerRef={scrollContainerRef} />

        {hasListEnd && (
          <div
            aria-hidden
            data-testid='virtual-list-sentinel'
            ref={sentinelRef}
            {...stylex.props(styles.sentinel)}
          />
        )}
      </div>
    </div>
  );
};
