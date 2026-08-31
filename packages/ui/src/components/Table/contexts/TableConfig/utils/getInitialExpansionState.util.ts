import type {
  TableGroupExpansionState,
  TableGroupFold,
} from '#ui/components/Table/Table.types';

type GetInitialExpansionStateArgs = {
  readonly defaultFold?: TableGroupFold;
};

/**
 * The expansion store's starting state: no group folded away from the default, so a
 * grouped table paints every level its read already returned (ADR-059, ADR-067) unless
 * the reader asked for the opposite.
 * `defaultFold` is the one thing here that does come from the loader — it is the reader's
 * Global Settings answer, and seeding it is what lets a `collapsed` preference land on the
 * first paint instead of after one.
 */
export const getInitialExpansionState = ({
  defaultFold = 'expanded',
}: GetInitialExpansionStateArgs = {}): TableGroupExpansionState => ({
  defaultFold,
  toggledGroupPaths: new Set<string>(),
});
