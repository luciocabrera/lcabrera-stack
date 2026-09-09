import type { TableGroupingState } from '#ui/components/Table/Table.types';

type GroupingCommitUpdate =
  | { readonly grouping: TableGroupingState; readonly kind: 'updated' }
  | { readonly kind: 'unchanged' };

type ResolveCommittedGroupingStateArgs = {
  readonly currentGrouping: TableGroupingState;
  readonly groupingUpdate: GroupingCommitUpdate;
  readonly totalsPlacement: TableGroupingState['totalsPlacement'];
};

export const resolveCommittedGroupingState = ({
  currentGrouping,
  groupingUpdate,
  totalsPlacement,
}: ResolveCommittedGroupingStateArgs) => ({
  ...(groupingUpdate.kind === 'updated'
    ? groupingUpdate.grouping
    : currentGrouping),
  totalsPlacement,
});
