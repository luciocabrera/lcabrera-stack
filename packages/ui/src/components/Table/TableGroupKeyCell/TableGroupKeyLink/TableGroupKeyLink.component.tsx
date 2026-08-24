import { useGetTableGroupDetailsPath } from '#ui/components/Table/contexts/TableConfig/meta/selectors';

import type { TableGroupKeyLinkProps } from './TableGroupKeyLink.types';

import { TableGroupDetailsAnchor } from '../TableGroupDetailsAnchor';

/**
 * A group key's text, linked to that group's rows where the route serves them
 * (#870) and plain where it does not.
 *
 * **The path is read here and the anchor is mounted only when there is one.**
 * Absent means the affordance is not offered — and, just as importantly, that
 * nothing below reaches for routing context, so a grouped table still renders
 * outside a `Router`. The anchor owns everything that does; see it for why the
 * link is not a tab stop.
 *
 * It reads the store itself rather than being handed the path: which route
 * serves a group's rows is meta the cell can reach, and threading it down would
 * put a prop on every level between for one leaf to use.
 */
export const TableGroupKeyLink = ({
  groupingKeys,
  summary,
  text,
}: TableGroupKeyLinkProps) => {
  const groupDetailsPath = useGetTableGroupDetailsPath();

  if (groupDetailsPath === undefined) return text;

  return (
    <TableGroupDetailsAnchor
      groupDetailsPath={groupDetailsPath}
      groupingKeys={groupingKeys}
      summary={summary}
      text={text}
    />
  );
};
