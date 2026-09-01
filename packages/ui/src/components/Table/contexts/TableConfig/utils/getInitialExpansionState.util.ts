import type {
  TableGroupExpansionState,
  TableGroupFold,
} from '#ui/components/Table/Table.types';

type GetInitialExpansionStateArgs = {
  readonly defaultFold?: TableGroupFold;
};

export const getInitialExpansionState = ({
  defaultFold = 'expanded',
}: GetInitialExpansionStateArgs = {}): TableGroupExpansionState => ({
  defaultFold,
  toggledGroupPaths: new Set<string>(),
});
