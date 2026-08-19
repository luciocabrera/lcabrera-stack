import type { TableGroupDrillFetcher } from '#ui/components/Table/Table.types';

type ResolveCanDrillGroupsArgs = {
  /** The route's ADR-063 capability: its endpoint serves a drilled page. */
  readonly isGroupDrillEnabled: boolean | undefined;
  /** The call that reaches that endpoint. */
  readonly onDrillGroup: TableGroupDrillFetcher | undefined;
};

/**
 * Whether this table can drill at all — and **both halves must say yes**.
 *
 * They answer different questions. `isGroupDrillEnabled` is the route declaring
 * that its endpoint serves a drilled page (ADR-063); `onDrillGroup` is the call
 * that reaches it, and it is a prop rather than loader data because a function
 * does not survive the loader boundary (ADR-009).
 *
 * Reading only the flag is the failure this exists to prevent: a consumer that
 * declares the capability and forgets the fetcher would get every leaf marked
 * drillable — a chevron, an `aria-expanded`, a keyboard gesture — and every use
 * of it would reach `useDrillTableGroup`, find no fetcher, and return. A control
 * that is offered, announced, and permanently inert is worse than one that was
 * never offered, because nothing on screen says why.
 *
 * Stated here rather than at each reader so the row metadata, the disclosure and
 * the keyboard path cannot disagree about whether a row is drillable.
 */
export const canDrillGroups = ({
  isGroupDrillEnabled,
  onDrillGroup,
}: ResolveCanDrillGroupsArgs) =>
  isGroupDrillEnabled === true && onDrillGroup !== undefined;
