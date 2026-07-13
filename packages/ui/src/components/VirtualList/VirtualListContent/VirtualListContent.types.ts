import type { VirtualListProps } from '../VirtualList.types';

/**
 * Props for the provider-less VirtualList composition — presentation only;
 * all list state flows through the VirtualList context selectors/actions.
 */
export type VirtualListContentProps = Pick<
  VirtualListProps,
  'listMaxHeight' | 'shouldFillHeight'
>;
