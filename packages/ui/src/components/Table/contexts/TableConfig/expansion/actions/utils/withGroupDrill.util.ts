import type {
  TableGroupDrill,
  TableGroupExpansionState,
} from '#ui/components/Table/Table.types';

type WithGroupDrillArgs = {
  readonly drill: TableGroupDrill;
  readonly drilledGroups: TableGroupExpansionState['drilledGroups'];
  readonly pathKey: string;
};

/**
 * One group's drill entry replaced, as a new map.
 *
 * A fresh `Map` rather than a mutation, because the store's subscribers compare
 * by reference: mutating the held one changes what every reader sees while
 * telling none of them it changed (ADR-067's rule for the collapsed set, which
 * this sits beside).
 */
export const withGroupDrill = ({
  drill,
  drilledGroups,
  pathKey,
}: WithGroupDrillArgs) => new Map(drilledGroups).set(pathKey, drill);
