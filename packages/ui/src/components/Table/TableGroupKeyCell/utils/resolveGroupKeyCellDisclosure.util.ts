import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';
import type {
  TableGroupDisclosureProps,
  TableGroupDisclosureState,
} from '#ui/components/Table/TableGroupDisclosure';

type ResolveGroupKeyCellDisclosureArgs = {
  readonly columnKey: string;
  readonly disclosure: TableGroupDisclosureState | undefined;
  /** Whether this column holds the row's own deepest level. */
  readonly isInnermost: boolean;
  /** The row's own group path — what a drill opens. */
  readonly path: readonly TableGroupKeyValue[];
};

const NO_LEVEL_DISCLOSURES: TableGroupDisclosureState['levelDisclosures'] = [];

/**
 * Which control this key cell draws, and for which group — or `undefined` when
 * it draws only the reserved space.
 *
 * **A drill is asked first, and only of the row's own innermost level.** The
 * two affordances are disjoint on the rows that matter — a rollup subtotal owns
 * loaded children and may not drill; an undrilled leaf owns nothing loaded — so
 * the order decides only one case: a leaf whose drilled rows are already
 * spliced in owns loaded children *and* is drillable. There the drill's own
 * state is the accurate one, because it reports a group as open from the moment
 * the fetch starts rather than when its rows arrive (ADR-079), and a fold
 * derived from the collapsed set alone would call it shut while its spinner
 * shows.
 */
export const resolveGroupKeyCellDisclosure = ({
  columnKey,
  disclosure,
  isInnermost,
  path,
}: ResolveGroupKeyCellDisclosureArgs):
  | TableGroupDisclosureProps
  | undefined => {
  if (isInnermost && disclosure?.isDrillable === true)
    return { disclosure, path };

  const level = disclosure?.levelDisclosures.find(
    (entry) => entry.columnKey === columnKey,
  );

  if (level !== undefined)
    return {
      disclosure: {
        hasChildren: true,
        isDrillable: false,
        isExpanded: level.isExpanded,
        levelDisclosures: NO_LEVEL_DISCLOSURES,
      },
      path: level.path,
    };

  return undefined;
};
